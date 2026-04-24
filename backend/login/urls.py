from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.auth_login, name='auth-login'),
    path('token-login/', views.auth_token_login, name='auth-token-login'),
    path('direct-login/', views.auth_direct_login, name='auth-direct-login'),
    path('callback/', views.auth_callback, name='auth-callback'),
    path('me/', views.auth_me, name='auth-me'),
]
