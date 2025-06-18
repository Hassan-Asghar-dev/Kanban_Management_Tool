from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db.models.signals import post_save
from django.dispatch import receiver

def validate_file_size(value):
    filesize = value.size
    if filesize > 5242880:  # 5MB
        raise ValidationError("Maximum file size is 5MB")

class UserProfile(models.Model):
    ROLE_CHOICES = (
        ('Project Manager', 'Project Manager'),
        ('Team Member', 'Team Member'),
    )

    POSITION_CHOICES = (
        ('Frontend Developer', 'Frontend Developer'),
        ('Backend Developer', 'Backend Developer'),
        ('Database Engineer', 'Database Engineer'),
        ('QA Tester', 'QA Tester'),
        ('Mobile App Developer', 'Mobile App Developer'),
        ('DevOps Engineer', 'DevOps Engineer'),
        ('Data Engineer', 'Data Engineer'),
        ('Machine Learning Engineer', 'Machine Learning Engineer'),
        ('UI/UX Designer', 'UI/UX Designer'),
        ('Business Analyst', 'Business Analyst'),
        ('Cloud Engineer', 'Cloud Engineer'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    name = models.CharField(max_length=255)
    position = models.CharField(max_length=100, choices=POSITION_CHOICES, blank=True)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='Team Member')
    profile_pic = models.ImageField(
        upload_to='profile_pics/',
        null=True,
        blank=True,
        validators=[validate_file_size]
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(null=True, blank=True)
    total_working_time = models.IntegerField(default=0)  # In seconds

    def __str__(self):
        return f"{self.name} - {self.role}"

    def save(self, *args, **kwargs):
        if self.role == 'Project Manager':
            self.position = ''
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'

class Team(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=6, unique=True)
    members = models.ManyToManyField(UserProfile, through='TeamMember', related_name='teams')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Team'
        verbose_name_plural = 'Teams'

class TeamMember(models.Model):
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='teammember')
    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE)
    working_hours = models.IntegerField(default=0)  # In hours
    member_name = models.CharField(max_length=255, blank=True)

    class Meta:
        unique_together = ('team', 'user_profile')
        verbose_name = 'Team Member'
        verbose_name_plural = 'Team Members'

    def __str__(self):
        return f"{self.member_name} - {self.team.name}"

class Card(models.Model):
    COLUMN_CHOICES = (
        ('backlog', 'Backlog'),
        ('todo', 'TODO'),
        ('doing', 'In Progress'),
        ('review', 'Review'),
        ('done', 'Complete'),
    )

    PRIORITY_CHOICES = (
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
    )

    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='cards')
    title = models.CharField(max_length=255)
    column = models.CharField(max_length=20, choices=COLUMN_CHOICES, default='backlog')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='Medium')
    assigned_to = models.ForeignKey(UserProfile, null=True, blank=True, on_delete=models.SET_NULL, related_name='assigned_cards')
    start_date = models.DateField(null=True, blank=True)
    deadline = models.DateField(null=True, blank=True)
    progress = models.IntegerField(default=0)
    updated_by = models.ForeignKey(UserProfile, null=True, on_delete=models.SET_NULL, related_name='updated_cards')
    sprint_start = models.DateTimeField(null=True, blank=True)
    sprint_finish = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.team.name}"

    class Meta:
        verbose_name = 'Card'
        verbose_name_plural = 'Cards'

class WorkDay(models.Model):
    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='workdays')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    working_hours = models.CharField(max_length=8, null=True, blank=True)  # Format: HH:MM:SS
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user_profile.name}'s WorkDay on {self.start_time.date()}"

    class Meta:
        verbose_name = 'Work Day'
        verbose_name_plural = 'Work Days'

# Signal to create/update UserProfile when User is created
@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.get_or_create(
            user=instance,
            defaults={
                'name': instance.first_name or f"User_{instance.username[:8]}",
                'role': 'Team Member'
            }
        )
    else:
        if hasattr(instance, 'profile'):
            profile = instance.profile
            if instance.first_name and profile.name != instance.first_name:
                profile.name = instance.first_name
                profile.save()