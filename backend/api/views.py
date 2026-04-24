import os
from django.db.models import Avg
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    Course, CourseFile, CourseProgress, Quiz, Question, Choice, QuizAttempt,
    ALLOWED_EXTENSIONS, MAX_FILE_SIZE, CustomQuiz, CustomCourse,
)
from .permissions import IsTMAdmin
from .serializers import (
    CourseSerializer, CourseFileSerializer, CourseProgressSerializer,
    QuizSerializer, QuizPublicSerializer, QuizAttemptSerializer, MemberSerializer,
)
from login.models import Member
from login.services import sync_member_to_registry, get_registry_user_by_email

ADMIN_FUNCTIONS = ('TM', 'PM')


# ── COURSES ──────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def course_list_create(request):
    if request.method == 'GET':
        qs = Course.objects.filter(
            is_active=True, function__in=[request.user.function, 'ALL']
        ).prefetch_related('files')
        return Response(CourseSerializer(qs, many=True, context={'request': request}).data)

    if request.user.function not in ADMIN_FUNCTIONS:
        return Response({'error': 'Permission denied'}, status=403)
    serializer = CourseSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(created_by=request.user)
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def course_detail(request, pk):
    try:
        course = Course.objects.prefetch_related('files').get(pk=pk)
    except Course.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    if request.method == 'GET':
        return Response(CourseSerializer(course, context={'request': request}).data)

    if request.user.function not in ADMIN_FUNCTIONS:
        return Response({'error': 'Permission denied'}, status=403)

    if request.method == 'PATCH':
        serializer = CourseSerializer(course, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    course.delete()
    return Response(status=204)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def course_upload(request, pk):
    if request.user.function not in ADMIN_FUNCTIONS:
        return Response({'error': 'Permission denied'}, status=403)
    try:
        course = Course.objects.get(pk=pk)
    except Course.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    uploaded_file = request.FILES.get('file')
    if not uploaded_file:
        return Response({'error': 'No file provided'}, status=400)

    ext = os.path.splitext(uploaded_file.name)[1].lstrip('.').lower()
    if ext not in ALLOWED_EXTENSIONS:
        return Response({'error': f'File type .{ext} not allowed'}, status=400)
    if uploaded_file.size > MAX_FILE_SIZE:
        return Response({'error': 'File exceeds 500 MB limit'}, status=400)

    if ext == 'pdf':
        file_type = 'pdf'
    elif ext in ('doc', 'docx', 'ppt', 'pptx'):
        file_type = 'doc'
    elif ext in ('mp4', 'mov', 'webm'):
        file_type = 'video'
    else:
        file_type = 'other'

    course_file = CourseFile.objects.create(
        course=course,
        file=uploaded_file,
        file_type=file_type,
        title=request.data.get('title', uploaded_file.name),
    )
    return Response(CourseFileSerializer(course_file, context={'request': request}).data, status=201)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def course_progress(request, pk):
    try:
        course = Course.objects.get(pk=pk)
    except Course.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    try:
        pct = float(request.data.get('progress_percent', 0))
    except (TypeError, ValueError):
        return Response({'error': 'Invalid progress_percent'}, status=400)

    pct = max(0.0, min(100.0, pct))
    cp, _ = CourseProgress.objects.get_or_create(member=request.user, course=course)
    cp.progress_percent = pct
    cp.completed = pct >= 100
    cp.save()
    sync_member_to_registry(request.user)
    return Response(CourseProgressSerializer(cp).data)


# ── QUIZZES ───────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def quiz_list_create(request):
    if request.method == 'GET':
        qs = Quiz.objects.filter(
            is_active=True, function__in=[request.user.function, 'ALL']
        ).prefetch_related('questions__choices')
        return Response(QuizPublicSerializer(qs, many=True).data)

    if request.user.function not in ADMIN_FUNCTIONS:
        return Response({'error': 'Permission denied'}, status=403)

    questions_data = request.data.get('questions', [])
    quiz_data = {
        'title': request.data.get('title'),
        'course': request.data.get('course'),
        'function': request.data.get('function', 'ALL'),
        'time_limit_minutes': request.data.get('time_limit_minutes'),
        'passing_score': request.data.get('passing_score', 70.0),
        'is_active': request.data.get('is_active', True),
    }
    serializer = QuizSerializer(data=quiz_data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    quiz = serializer.save(created_by=request.user)

    for i, q_data in enumerate(questions_data):
        choices_data = q_data.get('choices', [])
        question = Question.objects.create(
            quiz=quiz,
            text=q_data['text'],
            question_type=q_data.get('question_type', 'MCQ'),
            order=q_data.get('order', i),
        )
        for c_data in choices_data:
            Choice.objects.create(
                question=question,
                text=c_data['text'],
                is_correct=c_data.get('is_correct', False),
            )

    return Response(QuizSerializer(quiz).data, status=201)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def quiz_detail(request, pk):
    try:
        quiz = Quiz.objects.prefetch_related('questions__choices').get(pk=pk)
    except Quiz.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    if request.method == 'GET':
        is_admin = request.user.function in ADMIN_FUNCTIONS
        serializer = QuizSerializer if is_admin else QuizPublicSerializer
        return Response(serializer(quiz).data)

    if request.user.function not in ADMIN_FUNCTIONS:
        return Response({'error': 'Permission denied'}, status=403)

    if request.method == 'PATCH':
        serializer = QuizSerializer(quiz, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    quiz.delete()
    return Response(status=204)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def quiz_submit(request, pk):
    try:
        quiz = Quiz.objects.get(pk=pk)
    except Quiz.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    answers = request.data.get('answers', {})
    questions = quiz.questions.prefetch_related('choices').all()
    total = questions.count()
    if total == 0:
        return Response({'error': 'Quiz has no questions'}, status=400)

    correct_count = 0
    correct_answers = {}
    for question in questions:
        correct_choice = question.choices.filter(is_correct=True).first()
        correct_answers[str(question.id)] = correct_choice.id if correct_choice else None
        submitted = answers.get(str(question.id))
        if submitted is not None and correct_choice and int(submitted) == correct_choice.id:
            correct_count += 1

    score = round((correct_count / total) * 100, 1)
    passed = score >= quiz.passing_score

    attempt = QuizAttempt.objects.create(
        quiz=quiz,
        member=request.user,
        completed_at=timezone.now(),
        score=score,
        passed=passed,
        answers=answers,
    )
    sync_member_to_registry(request.user)

    return Response({
        'attempt_id': attempt.id,
        'score': score,
        'passed': passed,
        'correct_count': correct_count,
        'total': total,
        'correct_answers': correct_answers,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def quiz_attempts(request, pk):
    try:
        quiz = Quiz.objects.get(pk=pk)
    except Quiz.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    attempts = QuizAttempt.objects.filter(quiz=quiz, member=request.user)
    return Response(QuizAttemptSerializer(attempts, many=True).data)


# ── MEMBERS (TM/PM only) ──────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsTMAdmin])
def member_list(request):
    members = Member.objects.prefetch_related('login_records', 'quiz_attempts', 'course_progress').all()
    return Response(MemberSerializer(members, many=True).data)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated, IsTMAdmin])
def member_detail(request, pk):
    try:
        member = Member.objects.get(pk=pk)
    except Member.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    if request.method == 'GET':
        data = MemberSerializer(member).data
        data['quiz_history'] = QuizAttemptSerializer(
            member.quiz_attempts.select_related('quiz').all(), many=True
        ).data
        data['course_progress'] = CourseProgressSerializer(
            member.course_progress.select_related('course').all(), many=True
        ).data
        return Response(data)

    if 'function' in request.data:
        member.function = request.data['function']
        member.save(update_fields=['function'])
    return Response(MemberSerializer(member).data)


# ── DASHBOARD ─────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard(request):
    member = request.user
    registry_user = get_registry_user_by_email(member.email)

    quiz_grades = []
    enrolled_courses = []

    if registry_user:
        quiz_grades = registry_user.quiz_grades if isinstance(registry_user.quiz_grades, list) else []
        enrolled_courses = registry_user.enrolled_courses if isinstance(registry_user.enrolled_courses, list) else []

    scores = [g.get('score', 0) for g in quiz_grades if g.get('score') is not None]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0
    passed_count = sum(1 for g in quiz_grades if g.get('passed'))

    recent_quizzes = sorted(quiz_grades, key=lambda g: g.get('taken_at', ''), reverse=True)[:5]
    recent_courses = sorted(enrolled_courses, key=lambda c: c.get('enrolled_at', ''), reverse=True)[:5]

    return Response({
        'courses_enrolled': len(enrolled_courses),
        'quizzes_taken': len(quiz_grades),
        'avg_score': avg_score,
        'passed_count': passed_count,
        'recent_quizzes': recent_quizzes,
        'recent_courses': recent_courses,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsTMAdmin])
def dashboard_admin(request):
    members = Member.objects.all()
    courses = Course.objects.filter(is_active=True)
    attempts = QuizAttempt.objects.filter(completed_at__isnull=False)

    all_functions = ['iGV', 'oGV', 'iGTa', 'oGTa', 'iGTe', 'oGTe', 'MKT', 'FIN', 'TM', 'BD', 'PM', 'OTHER']
    function_stats = {}
    for fn in all_functions:
        fn_attempts = attempts.filter(member__function=fn)
        avg = fn_attempts.aggregate(avg=Avg('score'))['avg']
        function_stats[fn] = round(avg, 1) if avg is not None else 0

    return Response({
        'total_members': members.count(),
        'active_courses': courses.count(),
        'total_quizzes_taken': attempts.count(),
        'avg_score_per_function': function_stats,
        'members': MemberSerializer(members, many=True).data,
    })


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def custom_quiz_list_create(request):
    if request.method == 'GET':
        quizzes = CustomQuiz.objects.all().order_by('-created_at')
        function_filter = request.GET.get('function')
        if function_filter:
            quizzes = quizzes.filter(function__in=[function_filter, 'General'])
        data = [
            {
                'id': q.id,
                'function': q.function,
                'quiz_title': q.quiz_title,
                'question_count': len(q.questions) if isinstance(q.questions, list) else 0,
                'created_at': q.created_at,
            }
            for q in quizzes
        ]
        return Response(data)

    pos = (getattr(request.user, 'position', '') or '').lower()
    if 'mc' not in pos:
        return Response({'error': 'Permission denied'}, status=403)

    quiz_title = (request.data.get('quiz_title') or '').strip()
    function = (request.data.get('function') or '').strip()
    questions = request.data.get('questions') or []
    answers = request.data.get('answers') or {}

    if not quiz_title:
        return Response({'error': 'Quiz title is required'}, status=400)
    if not questions:
        return Response({'error': 'At least one question is required'}, status=400)

    quiz = CustomQuiz.objects.create(
        function=function,
        quiz_title=quiz_title,
        questions=questions,
        answers=answers,
    )
    return Response({'id': quiz.id, 'quiz_title': quiz.quiz_title}, status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def custom_quiz_detail(request, pk):
    try:
        q = CustomQuiz.objects.get(pk=pk)
    except CustomQuiz.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    questions = q.questions or []
    normalized_questions = []
    for i, q_item in enumerate(questions):
        if isinstance(q_item, dict):
            qid = q_item.get('id', i)
            text = q_item.get('text') or q_item.get('question') or ''
            choices_raw = q_item.get('choices') or q_item.get('options') or []
        else:
            qid = i
            text = str(q_item)
            choices_raw = []

        normalized_choices = []
        for j, c in enumerate(choices_raw):
            if isinstance(c, dict):
                cid = c.get('id', j)
                ctext = c.get('text') or c.get('label') or ''
            else:
                cid = j
                ctext = str(c)
            normalized_choices.append({'id': cid, 'text': ctext})

        normalized_questions.append({'id': qid, 'text': text, 'choices': normalized_choices})

    resp = {
        'id': q.id,
        'title': getattr(q, 'quiz_title', ''),
        'course': None,
        'function': getattr(q, 'function', ''),
        'created_by': None,
        'created_at': q.created_at,
        'time_limit_minutes': None,
        'passing_score': 70.0,
        'is_active': True,
        'questions': normalized_questions,
        'question_count': len(normalized_questions),
        '_custom': True,
    }

    return Response(resp)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def custom_quiz_submit(request, pk):
    try:
        q = CustomQuiz.objects.get(pk=pk)
    except CustomQuiz.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    submitted = request.data.get('answers', {}) or {}
    questions = q.questions or []
    total = len(questions)
    if total == 0:
        return Response({'error': 'Quiz has no questions'}, status=400)

    correct_count = 0
    correct_answers = {}
    answers_def = q.answers or {}
    per_question = []

    for i, question in enumerate(questions):
        # Normalize question structure
        if isinstance(question, dict):
            qid = question.get('id', i)
            qtext = question.get('text') or question.get('question') or ''
            choices_raw = question.get('choices') or question.get('options') or []
        else:
            qid = i
            qtext = str(question)
            choices_raw = []

        # Determine correct answer from answers_def
        ca = None
        if isinstance(answers_def, list):
            if i < len(answers_def):
                ca = answers_def[i]
        elif isinstance(answers_def, dict):
            ca = answers_def.get(str(qid)) or answers_def.get(str(i))

        # Get submitted answer (try by qid then by index)
        sub = submitted.get(str(qid))
        if sub is None:
            sub = submitted.get(str(i))

        # Build normalized choices with flags
        normalized_choices = []
        for j, c in enumerate(choices_raw):
            if isinstance(c, dict):
                cid = c.get('id', j)
                ctext = c.get('text') or c.get('label') or ''
            else:
                cid = j
                ctext = str(c)
            is_correct = (ca is not None and str(cid) == str(ca))
            is_selected = (sub is not None and str(cid) == str(sub))
            normalized_choices.append({'id': cid, 'text': ctext, 'is_correct': is_correct, 'is_selected': is_selected})

        per_question.append({
            'id': qid,
            'text': qtext,
            'choices': normalized_choices,
            'selected': sub,
            'correct': ca,
        })

        correct_answers[str(qid)] = ca
        if ca is not None and sub is not None and str(ca) == str(sub):
            correct_count += 1

    score = round((correct_count / total) * 100, 1)
    passing_score = getattr(q, 'passing_score', 70.0) if hasattr(q, 'passing_score') else 70.0
    passed = score >= passing_score

    # Persist grade in the user's registry row (quiz_grades JSON)
    try:
        registry_user = get_registry_user_by_email(request.user.email)
        if not registry_user:
            # attempt to create/sync registry row
            sync_member_to_registry(request.user)
            registry_user = get_registry_user_by_email(request.user.email)

        if registry_user:
            grades = registry_user.quiz_grades if isinstance(registry_user.quiz_grades, list) else []
            grades.append({
                'quiz_id': q.id,
                'quiz_title': getattr(q, 'quiz_title', '') or getattr(q, 'title', ''),
                'function': getattr(q, 'function', ''),
                'score': score,
                'passed': passed,
                'correct_count': correct_count,
                'total': total,
                'taken_at': timezone.now().isoformat(),
            })
            registry_user.quiz_grades = grades
            registry_user.save(update_fields=['quiz_grades'])
    except Exception:
        # Do not fail quiz submit if registry update fails; just continue
        pass

    return Response({
        'attempt_id': 0,
        'score': score,
        'passed': passed,
        'correct_count': correct_count,
        'total': total,
        'correct_answers': correct_answers,
        'per_question': per_question,
    })


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def custom_course_enroll(request, pk):
    try:
        course = CustomCourse.objects.get(pk=pk)
    except CustomCourse.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    registry_user = get_registry_user_by_email(request.user.email)
    if not registry_user:
        return Response({'error': 'Your email is not registered in users table'}, status=403)

    enrolled_courses = registry_user.enrolled_courses if isinstance(registry_user.enrolled_courses, list) else []

    def _is_enrolled():
        return any(str(item.get('course_id')) == str(pk) for item in enrolled_courses if isinstance(item, dict))

    if request.method == 'GET':
        return Response({'enrolled': _is_enrolled()})

    if _is_enrolled():
        return Response({'status': 'already_enrolled'}, status=200)

    enrolled_courses.append({
        'course_id': pk,
        'course_title': getattr(course, 'course_title', ''),
        'function': getattr(course, 'function', ''),
        'enrolled_at': timezone.now().isoformat(),
    })

    registry_user.enrolled_courses = enrolled_courses
    registry_user.enrolled_courses_count = len(enrolled_courses)
    registry_user.save(update_fields=['enrolled_courses', 'enrolled_courses_count'])

    # Keep profile fields in sync after enrollment update
    sync_member_to_registry(request.user)
    return Response({'status': 'enrolled'}, status=201)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def custom_course_list_create(request):
    if request.method == 'GET':
        courses = CustomCourse.objects.all().order_by('-created_at')
        function_filter = request.GET.get('function')
        if function_filter:
            courses = courses.filter(function__in=[function_filter, 'General'])
        data = [
            {
                'id': c.id,
                'function': c.function,
                'course_title': c.course_title,
                'course_description': c.course_description,
                'course_url': c.course_url,
                'created_at': c.created_at,
            }
            for c in courses
        ]
        return Response(data)

    pos = (getattr(request.user, 'position', '') or '').lower()
    if 'mc' not in pos:
        return Response({'error': 'Permission denied'}, status=403)

    course_title = (request.data.get('course_title') or '').strip()
    function = (request.data.get('function') or '').strip()
    course_description = (request.data.get('course_description') or '').strip()
    course_url = (request.data.get('course_url') or '').strip()

    if not course_title:
        return Response({'error': 'Course title is required'}, status=400)
    if not course_url:
        return Response({'error': 'Course URL is required'}, status=400)

    course = CustomCourse.objects.create(
        function=function,
        course_title=course_title,
        course_description=course_description,
        course_url=course_url,
    )
    return Response({'id': course.id, 'course_title': course.course_title, 'function': course.function}, status=201)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def custom_course_detail(request, pk):
    try:
        course = CustomCourse.objects.get(pk=pk)
    except CustomCourse.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    if request.method == 'GET':
        return Response({
            'id': course.id,
            'function': course.function,
            'course_title': course.course_title,
            'course_description': course.course_description,
            'course_url': course.course_url,
            'created_at': course.created_at,
        })

    pos = (getattr(request.user, 'position', '') or '').lower()
    if 'mc' not in pos:
        return Response({'error': 'Permission denied'}, status=403)

    if request.method == 'DELETE':
        course.delete()
        return Response(status=204)

    # PATCH
    if 'course_title' in request.data:
        course.course_title = (request.data['course_title'] or '').strip()
    if 'course_description' in request.data:
        course.course_description = (request.data['course_description'] or '').strip()
    if 'course_url' in request.data:
        course.course_url = (request.data['course_url'] or '').strip()
    if 'function' in request.data:
        course.function = (request.data['function'] or '').strip()
    if not course.course_title:
        return Response({'error': 'Course title is required'}, status=400)
    if not course.course_url:
        return Response({'error': 'Course URL is required'}, status=400)
    course.save()
    return Response({
        'id': course.id,
        'function': course.function,
        'course_title': course.course_title,
        'course_description': course.course_description,
        'course_url': course.course_url,
    })


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def custom_quiz_edit_delete(request, pk):
    try:
        quiz = CustomQuiz.objects.get(pk=pk)
    except CustomQuiz.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    pos = (getattr(request.user, 'position', '') or '').lower()
    if 'mc' not in pos:
        return Response({'error': 'Permission denied'}, status=403)

    if request.method == 'DELETE':
        quiz.delete()
        return Response(status=204)

    # PATCH
    if 'quiz_title' in request.data:
        quiz.quiz_title = (request.data['quiz_title'] or '').strip()
    if 'function' in request.data:
        quiz.function = (request.data['function'] or '').strip()
    if 'questions' in request.data:
        quiz.questions = request.data['questions'] or []
    if 'answers' in request.data:
        quiz.answers = request.data['answers'] or {}
    if not quiz.quiz_title:
        return Response({'error': 'Quiz title is required'}, status=400)
    quiz.save()
    return Response({'id': quiz.id, 'quiz_title': quiz.quiz_title, 'function': quiz.function})
