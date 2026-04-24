from django.db import models
from login.models import Member

FUNCTION_CHOICES = [
    ('iGV', 'iGV'),
    ('oGV', 'oGV'),
    ('iGTa', 'iGTa'),
    ('oGTa', 'oGTa'),
    ('iGTe', 'iGTe'),
    ('oGTe', 'oGTe'),
    ('MKT', 'MKT'),
    ('FIN', 'FIN'),
    ('TM', 'TM'),
    ('BD', 'BD'),
    ('PM', 'PM'),
    ('OTHER', 'OTHER'),
    ('ALL', 'ALL'),
]

FILE_TYPE_CHOICES = [
    ('pdf', 'PDF'),
    ('doc', 'Document'),
    ('video', 'Video'),
    ('other', 'Other'),
]

QUESTION_TYPE_CHOICES = [
    ('MCQ', 'Multiple Choice'),
    ('TF', 'True/False'),
]

ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'ppt', 'pptx', 'mp4', 'mov', 'webm'}
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500 MB


class Course(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    function = models.CharField(max_length=10, choices=FUNCTION_CHOICES, default='ALL')
    created_by = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, related_name='courses_created')
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.title


class CourseFile(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='files')
    file = models.FileField(upload_to='course_files/')
    file_type = models.CharField(max_length=10, choices=FILE_TYPE_CHOICES, default='other')
    title = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class CourseProgress(models.Model):
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='course_progress')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='progress')
    progress_percent = models.FloatField(default=0.0)
    completed = models.BooleanField(default=False)
    last_accessed = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('member', 'course')

    def __str__(self):
        return f"{self.member} - {self.course} ({self.progress_percent}%)"


class Quiz(models.Model):
    title = models.CharField(max_length=255)
    course = models.ForeignKey(Course, on_delete=models.SET_NULL, null=True, blank=True, related_name='quizzes')
    function = models.CharField(max_length=10, choices=FUNCTION_CHOICES, default='ALL')
    created_by = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, related_name='quizzes_created')
    created_at = models.DateTimeField(auto_now_add=True)
    time_limit_minutes = models.PositiveIntegerField(null=True, blank=True)
    passing_score = models.FloatField(default=70.0)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.title


class Question(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    question_type = models.CharField(max_length=3, choices=QUESTION_TYPE_CHOICES, default='MCQ')
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.text[:80]


class Choice(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices')
    text = models.CharField(max_length=500)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return self.text


class QuizAttempt(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='quiz_attempts')
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    score = models.FloatField(null=True, blank=True)
    passed = models.BooleanField(default=False)
    answers = models.JSONField(default=dict)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f"{self.member} - {self.quiz} ({self.score}%)"


class CustomQuiz(models.Model):
    function = models.TextField(blank=True, default='')
    quiz_title = models.TextField()
    questions = models.JSONField()
    answers = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'quizzes'


class CustomCourse(models.Model):
    function = models.TextField(blank=True, default='')
    course_title = models.TextField()
    course_description = models.TextField(blank=True, default='')
    course_url = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'courses'
