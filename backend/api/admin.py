from django.contrib import admin
from .models import UserProfile, Team, Card, TeamMember

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('name', 'position', 'role', 'is_active', 'last_login')
    list_filter = ('role', 'position', 'is_active')
    search_fields = ('name', 'user__email')
    readonly_fields = ('user', 'last_login')
    ordering = ('-name',)

    fieldsets = (
        ('User Information', {
            'fields': ('user', 'name', 'role', 'position')
        }),
        ('Profile Picture', {
            'fields': ('profile_pic',)
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('last_login',),
            'classes': ('collapse',)
        }),
    )

class TeamMemberInline(admin.TabularInline):
    model = TeamMember
    extra = 1
    fields = ['user_profile', 'member_name', 'working_hours']
    readonly_fields = ['user_profile']
    can_delete = True

@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ['team', 'user_profile', 'member_name', 'working_hours']
    list_filter = ['team']
    search_fields = ['member_name', 'user_profile__name']
    readonly_fields = ['team', 'user_profile']
    ordering = ['team']

@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at', 'updated_at']
    list_filter = ['created_at']
    search_fields = ['name']
    ordering = ['created_at']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [TeamMemberInline]
    fieldsets = (
        (None, {
            'fields': ('name', 'code', 'created_at', 'updated_at')
        }),
    )

@admin.register(Card)
class CardAdmin(admin.ModelAdmin):
    list_display = ['title', 'team', 'column', 'priority', 'progress', 'created_at']
    list_filter = ['column', 'priority', 'created_at']
    search_fields = ['title']
    ordering = ['created_at']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        (None, {
            'fields': ('team', 'column', 'title', 'priority', 'deadline', 'progress', 'created_at', 'updated_at')
        }),
    )