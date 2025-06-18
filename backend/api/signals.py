from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from django.db import transaction
from .models import User, UserProfile

# Signal to create a UserProfile automatically when a new User is created
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Creates a UserProfile automatically when a new User is registered.
    Defaults role to 'Team Member' if not specified.
    """
    if created:
        UserProfile.objects.get_or_create(
            user=instance,
            defaults={
                'role': 'Team Member',  # Default role
                'position': '',        # Empty by default
            }
        )

# Signal to delete the UserProfile when a User is deleted (optional)
@receiver(pre_delete, sender=User)
def delete_user_profile(sender, instance, **kwargs):
    """
    Deletes the UserProfile when the associated User is deleted.
    """
    try:
        instance.profile.delete()  # Uses the related_name='profile'
    except UserProfile.DoesNotExist:
        pass  # Profile doesn't exist, do nothing

# Optional: Add more signals (e.g., updating profile on user changes)
@receiver(post_save, sender=User)
def update_user_profile_on_email_change(sender, instance, **kwargs):
    """
    Example: Sync email changes to profile (if needed).
    """
    if hasattr(instance, 'profile'):
        pass  # Add logic here if needed (e.g., cache email in profile)