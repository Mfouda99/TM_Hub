import requests
from urllib.parse import urlencode
from django.conf import settings
from django.shortcuts import redirect
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Member, LoginRecord
from .services import is_email_authorized, sync_member_to_registry

VALID_FUNCTIONS = {'iGV', 'oGV', 'iGTa', 'oGTa', 'iGTe', 'oGTe', 'MKT', 'FIN', 'TM', 'BD', 'PM'}


def _frontend_url():
    origins = settings.CORS_ALLOWED_ORIGINS
    return origins[0] if origins else 'http://localhost:5173'


def _redirect_login_error(message):
    return redirect(f"{_frontend_url()}/login?{urlencode({'oauth_error': message})}")


def _get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


import re

def _extract_function_and_position(positions):
    if not positions:
        return 'OTHER', 'Member'
    
    for pos in positions:
        title = str(pos.get('title') or '').strip()
        role = str((pos.get('role') or {}).get('name') or '').strip()
        func = str((pos.get('function') or {}).get('name') or '').strip()
        
        full_desc = f"{title} {role} {func}".lower()
        words = set(re.findall(r'[a-z0-9&]+', full_desc))
        func_words = set(re.findall(r'[a-z0-9&]+', func.lower()))
        
        best_fn = 'OTHER'
        
        if 'ogv' in full_desc: best_fn = 'oGV'
        elif 'ogt' in full_desc or 'ogta' in full_desc or 'ogte' in full_desc: best_fn = 'oGTa'
        elif 'ogx' in full_desc: best_fn = 'oGV'  # default ogx to ogv
        elif 'igv' in full_desc: best_fn = 'iGV'
        elif 'igt' in full_desc or 'igta' in full_desc or 'igte' in full_desc: best_fn = 'iGTa'
        elif 'tm' in func_words or 'talent management' in func.lower(): best_fn = 'TM'
        elif 'bd' in words or 'b2b' in full_desc or 'business development' in func.lower(): best_fn = 'BD'
        elif 'fin' in words or 'finance' in func.lower(): best_fn = 'FIN'
        elif 'mkt' in words or 'marketing' in func.lower() or 'b2c' in full_desc: best_fn = 'MKT'
        elif 'pm' in words or 'projects' in func.lower() or 'pm' in func_words: best_fn = 'PM'
        
        full_position = title if title else (role or 'Member')
        
        return best_fn, full_position
        
    return 'OTHER', 'Member'


def _fetch_current_person(expa_token):
    current_person_query = """
    {
      currentPerson {
        id
        full_name
        email
        profile_photo
        home_lc { id name }
        current_positions {
          id
          title
          role { name }
          function { name }
          office { name }
        }
      }
    }
    """

    person_experiences_query = """
    query($id: ID!) {
      person(id: $id) {
        current_experiences {
          id
          __typename
        }
      }
    }
    """

    # Old working project used raw token in Authorization header.
    # Try both header styles for compatibility across EXPA/GIS deployments.
    auth_headers = [
        {'Authorization': expa_token},
        {'Authorization': f'Bearer {expa_token}'},
    ]

    def _run_query(query, variables=None):
        payload_body = {'query': query}
        if variables is not None:
            payload_body['variables'] = variables

        for header in auth_headers:
            try:
                gis_resp = requests.post(
                    settings.EXPA_GIS_URL,
                    json=payload_body,
                    headers=header,
                    timeout=15,
                )
            except requests.RequestException:
                continue

            if gis_resp.status_code != 200:
                continue

            try:
                return gis_resp.json()
            except ValueError:
                continue

        return None

    payload = _run_query(current_person_query)
    if not payload:
        return None, 'Profile fetch failed from AIESEC GIS. Please try again.'

    person = (payload.get('data') or {}).get('currentPerson')
    if not person:
        gql_errors = payload.get('errors') or []
        message = gql_errors[0].get('message') if gql_errors else None
        return None, (message or 'Profile fetch failed from AIESEC GIS. Please try again.')

    person_id = person.get('id')
    if person_id:
        payload2 = _run_query(person_experiences_query, {'id': person_id})
        person_data = ((payload2 or {}).get('data') or {}).get('person')
        if isinstance(person_data, dict) and 'current_experiences' in person_data:
            person['current_experiences'] = person_data['current_experiences']

    return person, None


@api_view(['GET'])
@permission_classes([AllowAny])
def auth_login(request):
    params = urlencode({
        'client_id': settings.EXPA_CLIENT_ID,
        'redirect_uri': settings.EXPA_REDIRECT_URI,
        'response_type': 'code',
    })
    auth_url = f"https://auth.aiesec.org/oauth/authorize?{params}"
    return Response({'auth_url': auth_url})


@api_view(['POST'])
@permission_classes([AllowAny])
def auth_token_login(request):
    """Direct token-based login using EXPA_ACCESS_TOKEN from settings."""
    if not settings.EXPA_ACCESS_TOKEN:
        return Response({'error': 'Token login not configured'}, status=400)

    person, person_error = _fetch_current_person(settings.EXPA_ACCESS_TOKEN)
    if not person:
        return Response({'error': person_error or 'Profile fetch failed'}, status=400)

    expa_id = str(person.get('id', ''))
    email = person.get('email') or f"expa_{expa_id}@aiesec.org"

    username = email.split('@')[0]
    function_name, position_name = _extract_function_and_position(person.get('current_positions') or [])

    member, _ = Member.objects.update_or_create(
        expa_id=expa_id,
        defaults={
            'username': username,
            'email': email,
            'full_name': person.get('full_name') or '',
            'profile_picture': person.get('profile_photo') or '',
            'home_lc': (person.get('home_lc') or {}).get('name', ''),
            'function': function_name,
            'position': position_name,
        },
    )

    LoginRecord.objects.create(
        member=member,
        ip_address=_get_client_ip(request),
        expa_token=settings.EXPA_ACCESS_TOKEN,
    )
    sync_member_to_registry(member)

    refresh = RefreshToken.for_user(member)
    return Response({
        'access_token': str(refresh.access_token),
        'refresh_token': str(refresh),
        'member': {
            'id': member.id,
            'full_name': member.full_name,
            'email': member.email,
            'function': member.function,
            'position': member.position,
            'home_lc': member.home_lc,
            'profile_picture': member.profile_picture,
        },
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def auth_direct_login(request):
    """
    Standalone direct login endpoint using EXPA_ACCESS_TOKEN from settings.
    POST /api/auth/direct-login/
    """
    if not settings.EXPA_ACCESS_TOKEN:
        return Response({'error': 'Direct login not configured. Set EXPA_ACCESS_TOKEN.'}, status=400)

    person, person_error = _fetch_current_person(settings.EXPA_ACCESS_TOKEN)
    if not person:
        return Response({'error': person_error or 'Failed to fetch profile'}, status=400)

    expa_id = str(person.get('id', ''))
    email = person.get('email') or f"expa_{expa_id}@aiesec.org"

    username = email.split('@')[0]
    function_name, position_name = _extract_function_and_position(person.get('current_positions') or [])

    member, created = Member.objects.update_or_create(
        expa_id=expa_id,
        defaults={
            'username': username,
            'email': email,
            'full_name': person.get('full_name') or '',
            'profile_picture': person.get('profile_photo') or '',
            'home_lc': (person.get('home_lc') or {}).get('name', ''),
            'function': function_name,
            'position': position_name,
        },
    )

    LoginRecord.objects.create(
        member=member,
        ip_address=_get_client_ip(request),
        expa_token=settings.EXPA_ACCESS_TOKEN,
    )
    sync_member_to_registry(member)

    refresh = RefreshToken.for_user(member)
    return Response({
        'status': 'success',
        'access_token': str(refresh.access_token),
        'refresh_token': str(refresh),
        'member': {
            'id': member.id,
            'expa_id': member.expa_id,
            'full_name': member.full_name,
            'email': member.email,
            'function': member.function,
            'position': member.position,
            'home_lc': member.home_lc,
            'profile_picture': member.profile_picture,
        },
    }, status=200)


@api_view(['GET'])
@permission_classes([AllowAny])
def auth_callback(request):
    code = request.GET.get('code')
    if not code:
        return Response({'error': 'No code provided'}, status=400)

    try:
        token_resp = requests.post(
            'https://auth.aiesec.org/oauth/token',
            data={
                'client_id': settings.EXPA_CLIENT_ID,
                'client_secret': settings.EXPA_CLIENT_SECRET,
                'code': code,
                'grant_type': 'authorization_code',
                'redirect_uri': settings.EXPA_REDIRECT_URI,
            },
            timeout=15,
        )
    except requests.RequestException:
        return _redirect_login_error('Could not reach EXPA auth service. Please check your network and try again.')

    if token_resp.status_code != 200:
        return _redirect_login_error('Token exchange failed. Please login again.')

    expa_token = token_resp.json().get('access_token', '')

    person, person_error = _fetch_current_person(expa_token)
    if not person:
        return _redirect_login_error(person_error or 'No profile data returned by EXPA account.')

    expa_id = str(person.get('id', ''))
    email = person.get('email') or f"expa_{expa_id}@aiesec.org"

    username = email.split('@')[0]
    function_name, position_name = _extract_function_and_position(person.get('current_positions') or [])

    member, _ = Member.objects.update_or_create(
        expa_id=expa_id,
        defaults={
            'username': username,
            'email': email,
            'full_name': person.get('full_name') or '',
            'profile_picture': person.get('profile_photo') or '',
            'home_lc': (person.get('home_lc') or {}).get('name', ''),
            'function': function_name,
            'position': position_name,
        },
    )

    LoginRecord.objects.create(
        member=member,
        ip_address=_get_client_ip(request),
        expa_token=expa_token,
    )
    sync_member_to_registry(member)

    refresh = RefreshToken.for_user(member)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)

    return redirect(f"{_frontend_url()}/auth/callback?token={access_token}&refresh={refresh_token}")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def auth_me(request):
    member = request.user
    return Response({
        'id': member.id,
        'expa_id': member.expa_id,
        'full_name': member.full_name,
        'email': member.email,
        'function': member.function,
        'position': member.position,
        'profile_picture': member.profile_picture,
        'home_lc': member.home_lc,
        'joined_at': member.joined_at,
        'login_count': member.login_records.count(),
    })
