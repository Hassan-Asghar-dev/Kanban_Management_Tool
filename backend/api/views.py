from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import UserProfile, Team, Card, TeamMember, WorkDay
from .serializers import UserProfileSerializer, TeamSerializer, CardSerializer, TeamMemberSerializer, WorkDaySerializer
from django.shortcuts import get_object_or_404
from rest_framework.mixins import ListModelMixin, UpdateModelMixin, RetrieveModelMixin, CreateModelMixin, DestroyModelMixin
from rest_framework.viewsets import GenericViewSet
from django.contrib.auth.models import User
from firebase_admin import auth
import jwt
from rest_framework.exceptions import AuthenticationFailed
import logging

logger = logging.getLogger(__name__)

class FirebaseAuthentication(IsAuthenticated):
    def has_permission(self, request, view):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header:
            raise AuthenticationFailed('No authorization header')
        try:
            token = auth_header.split(' ')[1]
            decoded_token = auth.verify_id_token(token)
            firebase_uid = decoded_token['uid']
            logger.debug(f"Token decoded successfully: {decoded_token}")
            try:
                user, created = User.objects.get_or_create(
                    username=firebase_uid,
                    defaults={
                        'email': decoded_token.get('email', ''),
                        'first_name': decoded_token.get('name', '')
                    }
                )
                if not created and (user.email != decoded_token.get('email') or user.first_name != decoded_token.get('name')):
                    user.email = decoded_token.get('email', user.email)
                    user.first_name = decoded_token.get('name', user.first_name)
                    user.save()
                logger.debug(f"{'Created new' if created else 'Found existing'} user with uid: {firebase_uid}")
            except Exception as e:
                logger.error(f"Error syncing user: {str(e)}")
                raise AuthenticationFailed(f'Error syncing user: {str(e)}')
            request.user = user
            return True
        except (jwt.InvalidTokenError, auth.InvalidIdTokenError):
            logger.error("Invalid token provided")
            raise AuthenticationFailed('Invalid token')
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            raise AuthenticationFailed(f'Authentication error: {str(e)}')

class UserProfileViewSet(viewsets.ModelViewSet):
    serializer_class = UserProfileSerializer
    permission_classes = [FirebaseAuthentication]

    def get_queryset(self):
        return UserProfile.objects.filter(user=self.request.user, is_active=True)

    def get_object(self):
        try:
            profile = UserProfile.objects.get(user=self.request.user)
            logger.debug(f"Found existing profile for user: {self.request.user.username}")
            logger.debug(f"Profile data: {profile.__dict__}")
        except UserProfile.DoesNotExist:
            logger.debug(f"Creating new profile for user: {self.request.user.username}")
            profile = UserProfile.objects.create(
                user=self.request.user,
                name=self.request.user.first_name or f"User_{self.request.user.username[:8]}",
                role='Team Member',
                position='',
                is_active=True
            )
            logger.debug(f"Created new profile: {profile.__dict__}")
        profile.last_login = timezone.now()
        profile.save()
        return profile

    def perform_update(self, serializer):
        logger.debug(f"Updating profile with data: {serializer.validated_data}")
        instance = serializer.save()
        logger.debug(f"Profile updated successfully: {instance.__dict__}")

    def list(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        logger.debug(f"Received update request with data: {request.data}")
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        data = request.data.copy()
        if not data.get('name'):
            data['name'] = instance.name or request.user.first_name or f"User_{request.user.username[:8]}"
        if not data.get('role'):
            data['role'] = 'Team Member'
        logger.debug(f"Processing data: {data}")
        serializer = self.get_serializer(
            instance,
            data=data,
            partial=partial,
            context={'request': request}
        )
        if serializer.is_valid():
            logger.debug("Data is valid. Saving...")
            try:
                updated_instance = serializer.save()
                logger.debug(f"Save successful. Updated instance: {updated_instance.__dict__}")
                return Response(serializer.data)
            except Exception as e:
                logger.error(f"Error saving data: {str(e)}")
                return Response(
                    {"detail": f"Error saving profile: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            logger.error(f"Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def deactivate(self, request):
        profile = self.get_object()
        profile.is_active = False
        profile.save()
        user = request.user
        user.is_active = False
        user.save()
        logger.debug(f"Account deactivated for user: {user.username}")
        return Response(
            {"message": "Account deactivated successfully"},
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'])
    def session_duration(self, request):
        profile = self.get_object()
        if profile.last_login:
            duration = timezone.now() - profile.last_login
            seconds = int(duration.total_seconds())
            logger.debug(f"Session duration for user {request.user.username}: {seconds} seconds")
            return Response({
                "duration_seconds": seconds,
                "formatted_duration": str(duration).split('.')[0]
            })
        logger.debug(f"No session duration available for user {request.user.username}")
        return Response({"duration_seconds": 0, "formatted_duration": "00:00:00"})

class TeamViewSet(ListModelMixin, CreateModelMixin, RetrieveModelMixin, DestroyModelMixin, GenericViewSet):
    serializer_class = TeamSerializer
    permission_classes = [FirebaseAuthentication]

    def get_queryset(self):
        queryset = Team.objects.filter(teammember__user_profile__user=self.request.user)
        try:
            queryset = queryset.prefetch_related('teammember__user_profile')
        except AttributeError as e:
            logger.error(f"Prefetch error: {str(e)}. Ensure TeamMember model is correctly configured.")
            queryset = Team.objects.filter(teammember__user_profile__user=self.request.user)
        return queryset

    def perform_create(self, serializer):
        profile = UserProfile.objects.get(user=self.request.user)
        if profile.role != 'Project Manager':
            logger.error(f"User {self.request.user.username} is not a Project Manager")
            raise serializers.ValidationError({"detail": "Only Project Managers can create teams"})
        logger.debug(f"Creating team with data: {serializer.validated_data}")
        team = serializer.save()
        team_member, created = TeamMember.objects.get_or_create(
            team=team,
            user_profile=profile,
            defaults={
                'member_name': profile.name,
                'working_hours': 0
            }
        )
        if created:
            logger.debug(f"Created new TeamMember entry for user {self.request.user.username} in team {team.name}")
        else:
            logger.debug(f"TeamMember entry already exists for user {self.request.user.username} in team {team.name}")
        logger.debug(f"Team created successfully: {team.__dict__}")

    def perform_destroy(self, instance):
        profile = UserProfile.objects.get(user=self.request.user)
        if profile.role != 'Project Manager':
            logger.error(f"User {self.request.user.username} is not a Project Manager")
            raise serializers.ValidationError({"detail": "Only Project Managers can delete teams"})
        logger.debug(f"Deleting team ID: {instance.id}, name: {instance.name}")
        instance.delete()
        logger.debug(f"Team {instance.id} deleted successfully")

    @action(detail=False, methods=['post'])
    def join(self, request):
        logger.debug(f"Reached join action with data: {request.data}")
        code = request.data.get('code')
        if not code:
            return Response(
                {"detail": "Team code is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            team = Team.objects.get(code=code)
            profile = UserProfile.objects.get(user=request.user)
            team_member, created = TeamMember.objects.get_or_create(
                team=team,
                user_profile=profile,
                defaults={
                    'member_name': profile.name,
                    'working_hours': 0
                }
            )
            if not created:
                return Response(
                    {"detail": "You are already a member of this team"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            serializer = self.get_serializer(team)
            logger.debug(f"User {self.request.user.username} joined team {team.name}")
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Team.DoesNotExist:
            logger.error(f"Invalid team code: {code}")
            return Response(
                {"detail": "Invalid team code"},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['delete'], url_path=r'members/(?P<member_id>\d+)')
    def remove_member(self, request, pk=None, member_id=None):
        profile = UserProfile.objects.get(user=self.request.user)
        if profile.role != 'Project Manager':
            logger.error(f"User {self.request.user.username} is not a Project Manager")
            return Response(
                {"detail": "Only Project Managers can remove team members"},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            team = Team.objects.get(id=pk)
            team_member = TeamMember.objects.filter(team=team, user_profile__id=member_id).first()
            if not team_member:
                return Response(
                    {"detail": "User is not a member of this team"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            team_member.delete()
            logger.debug(f"Removed user with ID {member_id} from team ID: {pk}")
            serializer = self.get_serializer(team)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Team.DoesNotExist:
            logger.error(f"Team {pk} not found")
            return Response(
                {"detail": "Team not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except UserProfile.DoesNotExist:
            logger.error(f"UserProfile with ID {member_id} not found")
            return Response(
                {"detail": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )

class TeamMemberViewSet(viewsets.ModelViewSet):
    serializer_class = TeamMemberSerializer
    permission_classes = [FirebaseAuthentication]

    def get_queryset(self):
        return TeamMember.objects.filter(user_profile__user=self.request.user)

class CardViewSet(viewsets.ModelViewSet):
    serializer_class = CardSerializer
    permission_classes = [FirebaseAuthentication]

    def get_queryset(self):
        team_id = self.request.query_params.get('team_id')
        logger.debug(f"Fetching cards for team_id: {team_id}, user: {self.request.user.username}")
        if not team_id:
            logger.warning("No team_id provided, returning empty queryset")
            return Card.objects.none()
        
        try:
            team = Team.objects.get(id=team_id)
            profile = UserProfile.objects.get(user=self.request.user)
            if not TeamMember.objects.filter(team=team, user_profile=profile).exists():
                logger.warning(f"User {self.request.user.username} is not a member of team {team_id}")
                return Card.objects.none()
            cards = Card.objects.filter(team=team)
            logger.debug(f"Returning {cards.count()} cards for team {team_id}")
            return cards
        except Team.DoesNotExist:
            logger.error(f"Team {team_id} does not exist")
            return Card.objects.none()

    def get_object(self):
        card_id = self.kwargs.get('pk')
        logger.debug(f"Retrieving card with ID: {card_id}, user: {self.request.user.username}")
        if not card_id or not card_id.isdigit():
            logger.error(f"Invalid card ID: {card_id}")
            raise serializers.ValidationError({"detail": "Invalid card ID"})
        try:
            card = get_object_or_404(Card, pk=card_id)
            profile = UserProfile.objects.get(user=self.request.user)
            if not TeamMember.objects.filter(team=card.team, user_profile=profile).exists():
                logger.warning(f"User {self.request.user.username} is not a member of team {card.team.id}")
                self.permission_denied(self.request, message="You are not a member of this team")
            logger.debug(f"Returning card: {card.title} (ID: {card_id})")
            return card
        except Card.DoesNotExist:
            logger.error(f"Card with ID {card_id} does not exist")
            raise serializers.ValidationError({"detail": "No Card matches the given query."})

    def perform_create(self, serializer):
        team_id = self.request.data.get('team')
        logger.debug(f"Creating card for team_id: {team_id}, user: {self.request.user.username}")
        try:
            team = Team.objects.get(id=team_id)
            profile = UserProfile.objects.get(user=self.request.user)
            if not TeamMember.objects.filter(team=team, user_profile=profile).exists():
                logger.error(f"User {self.request.user.username} is not a member of team {team_id}")
                raise serializers.ValidationError({"detail": "You are not a member of this team"})
            serializer.save(updated_by=profile)
            logger.debug(f"Card created successfully for team {team_id}")
        except Team.DoesNotExist:
            logger.error(f"Team {team_id} does not exist")
            raise serializers.ValidationError({"team": "Invalid team ID"})

    def perform_update(self, serializer):
        card = self.get_object()
        logger.debug(f"Updating card ID: {card.id}, user: {self.request.user.username}, data: {self.request.data}")
        profile = UserProfile.objects.get(user=self.request.user)
        
        # Check authorization for progress updates
        if 'progress' in self.request.data:
            if profile.role != 'Project Manager' and card.assigned_to != profile:
                logger.error(f"User {self.request.user.username} is not authorized to update progress for card {card.id}")
                raise serializers.ValidationError({"detail": "Only the assigned team member or Project Manager can update progress"})
        
        # Check authorization for sprint dates
        if 'sprint_start' in self.request.data or 'sprint_finish' in self.request.data:
            if profile.role != 'Project Manager':
                logger.error(f"User {self.request.user.username} is not a Project Manager")
                raise serializers.ValidationError({"detail": "Only Project Managers can update sprint dates"})
        
        serializer.save(updated_by=profile)
        logger.debug(f"Card {card.id} updated successfully")

    def perform_destroy(self, instance):
        logger.debug(f"Deleting card ID: {instance.id}, user: {self.request.user.username}")
        instance.delete()
        logger.debug(f"Card {instance.id} deleted successfully")

class WorkDayViewSet(viewsets.ModelViewSet):
    serializer_class = WorkDaySerializer
    permission_classes = [FirebaseAuthentication]

    def get_queryset(self):
        return WorkDay.objects.filter(user_profile__user=self.request.user)

    def perform_create(self, serializer):
        profile = UserProfile.objects.get(user=self.request.user)
        logger.debug(f"Checking active workdays for user: {self.request.user.username}, profile_id: {profile.id}")
        active_workdays = WorkDay.objects.filter(user_profile=profile, end_time__isnull=True)
        logger.debug(f"Active workdays found: {active_workdays.count()}, QuerySet: {active_workdays}")
        if active_workdays.exists():
            logger.warning(f"Active workday exists for user: {self.request.user.username}")
            raise serializers.ValidationError({"detail": "A work day is already active"})
        logger.debug(f"No active workdays. Creating new workday for user: {self.request.user.username}")
        serializer.save(user_profile=profile, start_time=timezone.now())

    @action(detail=False, methods=['post'])
    def end(self, request):
        try:
            profile = UserProfile.objects.get(user=self.request.user)
            workday = WorkDay.objects.filter(user_profile=profile, end_time__isnull=True).first()
            if not workday:
                return Response(
                    {"detail": "No active work day found"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            workday.end_time = timezone.now()
            delta = workday.end_time - workday.start_time
            hours, remainder = divmod(delta.seconds, 3600)
            minutes, seconds = divmod(remainder, 60)
            workday.working_hours = f"{hours:02}:{minutes:02}:{seconds:02}"
            workday.save()
            # Update total_working_time in UserProfile
            profile.total_working_time += delta.seconds
            profile.save()
            serializer = WorkDaySerializer(workday)
            return Response(serializer.data)
        except UserProfile.DoesNotExist:
            return Response(
                {"detail": "User profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )