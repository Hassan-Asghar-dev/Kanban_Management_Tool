from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserProfileViewSet, TeamViewSet, CardViewSet, WorkDayViewSet

# Initialize the router
router = DefaultRouter()
# Register viewsets with appropriate basenames
router.register(r'profile', UserProfileViewSet, basename='profile')
router.register(r'teams', TeamViewSet, basename='team')
router.register(r'cards', CardViewSet, basename='card')
router.register(r'workdays', WorkDayViewSet, basename='workday')  # Added WorkDayViewSet

urlpatterns = [
    path('teams/join/', TeamViewSet.as_view({'post': 'join'}), name='team-join'),
    path('teams/<int:pk>/members/<str:username>/', TeamViewSet.as_view({'delete': 'remove_member'}), name='team-remove-member'),
    path('', include(router.urls)),  # Router URLs come last to avoid conflicts
]