from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Team, Card, TeamMember, WorkDay
import base64
import uuid
from django.core.files.base import ContentFile
import logging

logger = logging.getLogger(__name__)

class UserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'email', 'profile', 'name')
        read_only_fields = ('id', 'email')

    def get_profile(self, obj):
        try:
            profile = obj.profile
            request = self.context.get('request')
            profile_pic_url = request.build_absolute_uri(profile.profile_pic.url) if profile.profile_pic else None
            return {
                'name': profile.name,
                'role': profile.role,
                'position': profile.position,
                'profile_pic': profile_pic_url,
            }
        except UserProfile.DoesNotExist:
            return {
                'name': f"User_{obj.username[:8]}",
                'role': 'Team Member',
                'position': '',
                'profile_pic': None,
            }

class UserProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    profile_pic = serializers.SerializerMethodField()
    profile_pic_data = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = UserProfile
        fields = (
            'id',
            'name',
            'position',
            'role',
            'profile_pic',
            'profile_pic_data',
            'email',
            'is_active',
            'created_at',
            'updated_at',
            'last_login',
        )
        read_only_fields = ('id', 'email', 'is_active', 'created_at', 'updated_at', 'last_login')

    def get_profile_pic(self, obj):
        if obj.profile_pic:
            return self.context['request'].build_absolute_uri(obj.profile_pic.url)
        return None

    def validate(self, data):
        if 'name' in data and not data['name'].strip():
            raise serializers.ValidationError({"name": "Name cannot be empty"})
        if 'role' in data and data['role'] not in dict(UserProfile.ROLE_CHOICES):
            raise serializers.ValidationError({"role": "Invalid role selected"})
        if 'role' in data and data['role'] == 'Project Manager':
            data['position'] = ''
        elif 'position' in data and data['position'] and data['position'] not in dict(UserProfile.POSITION_CHOICES):
            raise serializers.ValidationError({"position": "Invalid position selected"})
        return data

    def validate_profile_pic_data(self, value):
        if value:
            try:
                format, imgstr = value.split(';base64,')
                ext = format.split('/')[-1]
                if len(imgstr) * 3/4 > 5 * 1024 * 1024:
                    raise serializers.ValidationError("Profile picture size should not exceed 5MB")
                return value
            except Exception:
                raise serializers.ValidationError("Invalid image format")
        return value

    def update(self, instance, validated_data):
        profile_pic_data = validated_data.pop('profile_pic_data', None)
        if profile_pic_data:
            try:
                format, imgstr = profile_pic_data.split(';base64,')
                ext = format.split('/')[-1]
                file_name = f"{uuid.uuid4()}.{ext}"
                data = ContentFile(base64.b64decode(imgstr))
                if instance.profile_pic:
                    instance.profile_pic.delete()
                instance.profile_pic.save(file_name, data, save=False)
            except Exception as e:
                raise serializers.ValidationError(f"Error processing profile picture: {str(e)}")

        instance.name = validated_data.get('name', instance.name)
        instance.role = validated_data.get('role', instance.role)
        if validated_data.get('role') == 'Project Manager':
            instance.position = ''
        else:
            instance.position = validated_data.get('position', instance.position)

        instance.save()
        return instance

class TeamMemberSerializer(serializers.ModelSerializer):
    user_profile_name = serializers.CharField(source='user_profile.name', read_only=True)

    class Meta:
        model = TeamMember
        fields = ['id', 'team', 'user_profile', 'user_profile_name', 'member_name']
        read_only_fields = ['id', 'team', 'user_profile', 'user_profile_name']

class TeamSerializer(serializers.ModelSerializer):
    members = serializers.SerializerMethodField()
    code = serializers.CharField(max_length=6, required=True)

    class Meta:
        model = Team
        fields = ('id', 'name', 'code', 'members', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_members(self, obj):
        team_members = obj.teammember.all()
        return [{'id': tm.user_profile.id, 'name': tm.user_profile.name, 'firebase_uid': tm.user_profile.user.username} for tm in team_members]

    def validate(self, data):
        if 'name' in data and not data['name'].strip():
            raise serializers.ValidationError({"name": "Team name cannot be empty"})
        if 'code' in data:
            code = data['code']
            if len(code) != 6 or not code.isalnum():
                raise serializers.ValidationError({"code": "Team code must be 6 alphanumeric characters"})
        return data

    def create(self, validated_data):
        team = Team.objects.create(
            name=validated_data['name'],
            code=validated_data['code']
        )
        request = self.context.get('request')
        profile = request.user.profile
        TeamMember.objects.create(
            team=team,
            user_profile=profile,
            member_name=profile.name,
            working_hours=0
        )
        return team

class CardSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.SerializerMethodField()
    updated_by = serializers.SlugRelatedField(
        read_only=True,
        slug_field='name'
    )
    assigned_to = serializers.PrimaryKeyRelatedField(
        queryset=UserProfile.objects.all(),
        required=False,
        allow_null=True
    )
    assigned_to_id = serializers.IntegerField(source='assigned_to.id', read_only=True)

    class Meta:
        model = Card
        fields = (
            'id',
            'team',
            'title',
            'column',
            'priority',
            'assigned_to',
            'assigned_to_id',
            'assigned_to_name',
            'start_date',
            'deadline',
            'progress',
            'updated_by',
            'sprint_start',
            'sprint_finish',
            'created_at',
            'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'updated_by', 'assigned_to_id')

    def get_assigned_to_name(self, obj):
        return obj.assigned_to.name if obj.assigned_to else None

    def validate(self, data):
        logger.debug(f"Validating card data: {data}")
        if 'title' in data and not data['title'].strip():
            raise serializers.ValidationError({"title": "Card title cannot be empty"})
        if 'column' in data and data['column'] not in dict(Card.COLUMN_CHOICES):
            raise serializers.ValidationError({"column": "Invalid column selected"})
        if 'priority' in data and data['priority'] not in dict(Card.PRIORITY_CHOICES):
            raise serializers.ValidationError({"priority": "Invalid priority selected"})
        if 'progress' in data:
            progress = data['progress']
            if not isinstance(progress, int) or progress < 0 or progress > 100:
                raise serializers.ValidationError({"progress": "Progress must be an integer between 0 and 100"})
        if 'assigned_to' in data and data['assigned_to']:
            team_id = data.get('team') or (self.instance.team.id if self.instance else None)
            if team_id and not TeamMember.objects.filter(team_id=team_id, user_profile=data['assigned_to']).exists():
                raise serializers.ValidationError({"assigned_to": "Assigned user must be a team member"})
        sprint_start = data.get('sprint_start')
        sprint_finish = data.get('sprint_finish')
        if sprint_start and sprint_finish and sprint_start > sprint_finish:
            raise serializers.ValidationError({"sprint_finish": "Sprint finish must be after sprint start"})
        return data

class WorkDaySerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkDay
        fields = ['id', 'user_profile', 'start_time', 'end_time', 'working_hours', 'created_at']
        read_only_fields = ['id', 'user_profile', 'created_at', 'working_hours']