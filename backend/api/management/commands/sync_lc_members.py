import os
import json
import requests
from django.core.management.base import BaseCommand
from django.db import connection

GIS_URL = 'https://gis-api.aiesec.org/graphql'

QUERY = """
query SyncMembers($page: Int) {
  people(
    filters: { current_committee: [1725] }
    pagination: { page: $page, per_page: 100 }
  ) {
    paging {
      total_items
      total_pages
      current_page
    }
    data {
      id
      full_name
      email
      current_positions {
        title
        function {
          name
        }
      }
    }
  }
}
"""


def _add_position_column_if_missing():
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'users' AND column_name = 'position'
        """)
        if not cursor.fetchone():
            cursor.execute("ALTER TABLE users ADD COLUMN position TEXT NOT NULL DEFAULT ''")


def _fetch_page(token, page):
    # GIS API accepts the raw token directly (no Bearer/Token prefix)
    for auth_header in [token, f'Bearer {token}']:
        resp = requests.post(
            GIS_URL,
            json={'query': QUERY, 'variables': {'page': page}},
            headers={'Authorization': auth_header},
            timeout=30,
        )
        if resp.status_code == 200:
            data = resp.json()
            if 'errors' in data:
                raise Exception(f"GraphQL errors: {data['errors']}")
            return data['data']['people']
    resp.raise_for_status()


def _upsert_member(name, email, function, position):
    with connection.cursor() as cursor:
        cursor.execute("SELECT id FROM users WHERE lower(email) = lower(%s)", [email])
        row = cursor.fetchone()
        if row:
            cursor.execute(
                """
                UPDATE users
                SET name = %s, function = %s, position = %s
                WHERE lower(email) = lower(%s)
                """,
                [name, function, position, email],
            )
            return 'updated'
        else:
            cursor.execute(
                """
                INSERT INTO users
                  (name, email, lc, function, position,
                   enrolled_courses, enrolled_courses_count,
                   quizzes_taken_count, quiz_grades)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                [
                    name, email, 'Egypt', function, position,
                    json.dumps([]), 0, 0, json.dumps([]),
                ],
            )
            return 'created'


class Command(BaseCommand):
    help = 'Fetch all members from LC 1725 via GIS API and upsert into the users table'

    def add_arguments(self, parser):
        parser.add_argument(
            '--token',
            type=str,
            default='',
            help='EXPA access token (overrides EXPA_ACCESS_TOKEN env var)',
        )

    def handle(self, *_args, **options):
        token = options.get('token') or os.environ.get('EXPA_ACCESS_TOKEN', '')
        if not token:
            self.stderr.write('Provide a token via --token or EXPA_ACCESS_TOKEN env var')
            return

        _add_position_column_if_missing()

        page = 1
        total_pages = 1
        created = updated = skipped = 0

        while page <= total_pages:
            self.stdout.write(f'Fetching page {page}/{total_pages}...')
            result = _fetch_page(token, page)
            paging = result.get('paging', {})
            total_pages = paging.get('total_pages', 1)
            members = result.get('data', [])

            for person in members:
                name = (person.get('full_name') or '').strip()
                email = (person.get('email') or '').strip()
                if not email:
                    skipped += 1
                    continue

                positions = person.get('current_positions') or []
                fn = ''
                pos_title = ''
                if positions:
                    first = positions[0]
                    fn_obj = first.get('function') or {}
                    fn = (fn_obj.get('name') or '').strip()
                    pos_title = (first.get('title') or '').strip()

                action = _upsert_member(name, email, fn, pos_title)
                if action == 'created':
                    created += 1
                    self.stdout.write(f'  + {name} <{email}> [{fn} / {pos_title}]')
                else:
                    updated += 1
                    self.stdout.write(f'  ~ {name} <{email}> [{fn} / {pos_title}]')

            page += 1

        self.stdout.write(self.style.SUCCESS(
            f'\nDone. Created: {created}  Updated: {updated}  Skipped (no email): {skipped}'
        ))
