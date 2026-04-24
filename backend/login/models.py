from django.contrib.auth.models import AbstractUser
from django.db import models

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
]


class Member(AbstractUser):
    expa_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    full_name = models.CharField(max_length=255, blank=True)
    function = models.CharField(max_length=10, choices=FUNCTION_CHOICES, default='OTHER')
    position = models.CharField(max_length=255, default='Member', blank=True)
    profile_picture = models.URLField(max_length=500, blank=True)
    home_lc = models.CharField(max_length=255, blank=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'login_member'

    def __str__(self):
        return self.full_name or self.username


class LoginRecord(models.Model):
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='login_records')
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    expa_token = models.TextField(blank=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.member} @ {self.timestamp}"


class UserRegistry(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.TextField()
    email = models.EmailField(unique=True)
    lc = models.TextField(blank=True, default='')
    function = models.TextField(blank=True, default='')
    position = models.TextField(blank=True, default='')
    enrolled_courses = models.JSONField(default=list, blank=True, db_column='enrolled_courses')
    enrolled_courses_count = models.IntegerField(default=0)
    quizzes_taken_count = models.IntegerField(default=0)
    quiz_grades = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'users'

    def __str__(self):
        return self.email


class CustomCourseEnrollment(models.Model):
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='custom_enrollments')
    custom_course_id = models.IntegerField()
    course_title = models.TextField(blank=True, default='')
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('member', 'custom_course_id')
        db_table = 'custom_course_enrollments'

    def __str__(self):
        return f"{self.member.email} -> {self.custom_course_id}"
