from .models import UserRegistry
import json
from django.db import connection


def _serialize_quiz_grades(member):
    attempts = member.quiz_attempts.filter(completed_at__isnull=False).select_related('quiz').order_by('-completed_at')[:50]
    return [
        {
            'quiz_id': attempt.quiz_id,
            'quiz_title': attempt.quiz.title if attempt.quiz_id else '',
            'score': attempt.score,
            'passed': attempt.passed,
            'completed_at': attempt.completed_at.isoformat() if attempt.completed_at else None,
            'taken_at': attempt.completed_at.isoformat() if attempt.completed_at else None,
        }
        for attempt in attempts
    ]


def get_registry_user_by_email(email):
    """Return a lightweight registry row wrapper for the users table.

    Uses raw SQL to avoid Django JSONField conversion issues in this project.
    The returned object supports attribute access and a `.save(update_fields=...)` method.
    """
    normalized = (email or '').strip()
    if not normalized:
        return None

    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT id, name, email, lc, function, enrolled_courses_count,
                   quizzes_taken_count, quiz_grades, created_at,
                   enrolled_courses AS enrolled_courses
            FROM users
            WHERE lower(email) = lower(%s)
            LIMIT 1
            """,
            [normalized],
        )
        row = cursor.fetchone()
        if not row:
            return None
        cols = [c[0] for c in cursor.description]

    row_dict = dict(zip(cols, row))

    # Normalize JSON columns to Python lists/dicts
    ec = row_dict.get('enrolled_courses')
    if isinstance(ec, str):
        try:
            row_dict['enrolled_courses'] = json.loads(ec)
        except Exception:
            row_dict['enrolled_courses'] = []
    elif ec is None:
        row_dict['enrolled_courses'] = []

    qg = row_dict.get('quiz_grades')
    if isinstance(qg, str):
        try:
            row_dict['quiz_grades'] = json.loads(qg)
        except Exception:
            row_dict['quiz_grades'] = []
    elif qg is None:
        row_dict['quiz_grades'] = []

    class RegistryRow:
        def __init__(self, data):
            super().__setattr__('_data', data)

        def __getattr__(self, name):
            if name in self._data:
                return self._data[name]
            raise AttributeError(name)

        def __setattr__(self, name, value):
            if name == '_data':
                super().__setattr__(name, value)
            else:
                self._data[name] = value

        def save(self, update_fields=None):
            fields = list(update_fields) if update_fields else list(self._data.keys())
            set_clauses = []
            params = []
            for f in fields:
                if f not in self._data or f == 'id':
                    continue
                db_col = 'enrolled_courses' if f == 'enrolled_courses' else f
                set_clauses.append(f'"{db_col}" = %s')
                if f in ('enrolled_courses', 'quiz_grades'):
                    params.append(json.dumps(self._data[f]))
                else:
                    params.append(self._data[f])
            if not set_clauses:
                return
            params.append(self._data.get('id'))
            query = f'UPDATE users SET {", ".join(set_clauses)} WHERE id = %s'
            with connection.cursor() as cursor:
                cursor.execute(query, params)

        def to_dict(self):
            return dict(self._data)

    return RegistryRow(row_dict)


def is_email_authorized(email):
    return get_registry_user_by_email(email) is not None


def sync_member_to_registry(member):
    registry_user = get_registry_user_by_email(member.email)
    # If no registry row exists, create a minimal one so logins aren't blocked.
    if not registry_user:
        initial_quiz_grades = _serialize_quiz_grades(member)
        quizzes_count = member.quiz_attempts.filter(completed_at__isnull=False).count()
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO users (name, email, lc, function, enrolled_courses, enrolled_courses_count, quizzes_taken_count, quiz_grades)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                [
                    (member.full_name or member.username or ''),
                    (member.email or ''),
                    (member.home_lc or ''),
                    (member.function or ''),
                    json.dumps([]),
                    0,
                    quizzes_count,
                    json.dumps(initial_quiz_grades),
                ],
            )
            try:
                new_id = cursor.fetchone()[0]
            except Exception:
                new_id = None

        registry_user = get_registry_user_by_email(member.email)
        if not registry_user:
            return False

    registry_user.name = member.full_name or member.username or ''
    registry_user.email = member.email or ''
    registry_user.lc = member.home_lc or ''
    registry_user.function = member.function or ''
    enrolled_courses = registry_user.enrolled_courses if isinstance(registry_user.enrolled_courses, list) else []
    registry_user.enrolled_courses_count = len(enrolled_courses)

    # Merge existing quiz_grades with serialized quiz attempts without dropping custom entries
    existing_grades = registry_user.quiz_grades if isinstance(registry_user.quiz_grades, list) else []
    recent = _serialize_quiz_grades(member)

    def exists_similar(ex_list, item):
        for ex in ex_list:
            if ex.get('quiz_id') == item.get('quiz_id') and ex.get('taken_at') == item.get('taken_at'):
                return True
        return False

    merged = list(existing_grades)
    for r in recent:
        if not exists_similar(merged, r):
            merged.insert(0, r)

    registry_user.quiz_grades = merged
    registry_user.quizzes_taken_count = len(merged)
    registry_user.save(
        update_fields=[
            'name',
            'email',
            'lc',
            'function',
            'enrolled_courses_count',
            'quizzes_taken_count',
            'quiz_grades',
        ]
    )
    return True
