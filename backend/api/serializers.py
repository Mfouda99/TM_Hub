from rest_framework import serializers
from .models import Course, CourseFile, CourseProgress, Quiz, Question, Choice, QuizAttempt
from login.models import Member


class MemberSerializer(serializers.ModelSerializer):
    login_count = serializers.SerializerMethodField()
    quizzes_taken = serializers.SerializerMethodField()
    avg_score = serializers.SerializerMethodField()
    course_completion = serializers.SerializerMethodField()

    class Meta:
        model = Member
        fields = [
            'id', 'expa_id', 'full_name', 'email', 'function',
            'profile_picture', 'home_lc', 'joined_at',
            'login_count', 'quizzes_taken', 'avg_score', 'course_completion',
        ]

    def get_login_count(self, obj):
        return obj.login_records.count()

    def get_quizzes_taken(self, obj):
        return obj.quiz_attempts.filter(completed_at__isnull=False).count()

    def get_avg_score(self, obj):
        attempts = list(obj.quiz_attempts.filter(completed_at__isnull=False, score__isnull=False))
        if not attempts:
            return 0
        return round(sum(a.score for a in attempts) / len(attempts), 1)

    def get_course_completion(self, obj):
        return obj.course_progress.filter(completed=True).count()


class CourseFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseFile
        fields = ['id', 'file', 'file_type', 'title', 'uploaded_at']


class CourseSerializer(serializers.ModelSerializer):
    files = CourseFileSerializer(many=True, read_only=True)
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'description', 'function',
            'created_by', 'created_by_name', 'created_at', 'is_active', 'files',
        ]
        read_only_fields = ['created_by', 'created_at']

    def get_created_by_name(self, obj):
        return obj.created_by.full_name if obj.created_by else ''


class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ['id', 'text', 'is_correct']


class ChoicePublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ['id', 'text']


class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'text', 'question_type', 'order', 'choices']


class QuestionPublicSerializer(serializers.ModelSerializer):
    choices = ChoicePublicSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'text', 'question_type', 'order', 'choices']


class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    question_count = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = [
            'id', 'title', 'course', 'function', 'created_by', 'created_at',
            'time_limit_minutes', 'passing_score', 'is_active', 'questions', 'question_count',
        ]
        read_only_fields = ['created_by', 'created_at']

    def get_question_count(self, obj):
        return obj.questions.count()


class QuizPublicSerializer(serializers.ModelSerializer):
    questions = QuestionPublicSerializer(many=True, read_only=True)
    question_count = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = [
            'id', 'title', 'course', 'function', 'created_by', 'created_at',
            'time_limit_minutes', 'passing_score', 'is_active', 'questions', 'question_count',
        ]
        read_only_fields = ['created_by', 'created_at']

    def get_question_count(self, obj):
        return obj.questions.count()


class QuizAttemptSerializer(serializers.ModelSerializer):
    quiz_title = serializers.SerializerMethodField()

    class Meta:
        model = QuizAttempt
        fields = ['id', 'quiz', 'quiz_title', 'started_at', 'completed_at', 'score', 'passed', 'answers']
        read_only_fields = ['started_at', 'completed_at', 'score', 'passed']

    def get_quiz_title(self, obj):
        return obj.quiz.title


class CourseProgressSerializer(serializers.ModelSerializer):
    course_title = serializers.SerializerMethodField()

    class Meta:
        model = CourseProgress
        fields = ['id', 'course', 'course_title', 'progress_percent', 'completed', 'last_accessed']

    def get_course_title(self, obj):
        return obj.course.title
