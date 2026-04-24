from rest_framework.permissions import BasePermission


class IsTMAdmin(BasePermission):
    message = 'Access restricted to TM and PM functions.'

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.function in ('TM', 'PM')
