from django.urls import path
from . import views

urlpatterns = [
    path('courses/', views.course_list_create),
    path('courses/<int:pk>/', views.course_detail),
    path('courses/<int:pk>/upload/', views.course_upload),
    path('courses/<int:pk>/progress/', views.course_progress),
    path('quizzes/', views.quiz_list_create),
    path('quizzes/<int:pk>/', views.quiz_detail),
    path('quizzes/<int:pk>/submit/', views.quiz_submit),
    path('quizzes/<int:pk>/attempts/', views.quiz_attempts),
    path('members/', views.member_list),
    path('members/<int:pk>/', views.member_detail),
    path('dashboard/', views.dashboard),
    path('dashboard/admin/', views.dashboard_admin),
    path('custom-quizzes/', views.custom_quiz_list_create),
    path('custom-quizzes/<int:pk>/', views.custom_quiz_detail),
    path('custom-quizzes/', views.custom_quiz_list_create),
    path('custom-quizzes/<int:pk>/submit/', views.custom_quiz_submit),
    path('custom-courses/', views.custom_course_list_create),
    path('custom-courses/<int:pk>/', views.custom_course_detail),
    path('custom-courses/<int:pk>/enroll/', views.custom_course_enroll),
    path('custom-quizzes/<int:pk>/edit/', views.custom_quiz_edit_delete),
]
