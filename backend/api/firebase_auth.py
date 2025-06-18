from firebase_admin import auth, credentials, initialize_app
from rest_framework import authentication
from rest_framework import exceptions
from django.contrib.auth.models import User
import os
from django.conf import settings

# Initialize Firebase Admin with the credentials
cred = credentials.Certificate(os.path.join(settings.BASE_DIR, 'api', 'firebase_credential.json'))
try:
    initialize_app(cred)
except ValueError:
    # App already initialized
    pass

class FirebaseAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header:
            print("No Authorization header found")
            return None

        try:
            # Check if the header starts with 'Bearer'
            if not auth_header.startswith('Bearer '):
                raise exceptions.AuthenticationFailed('Invalid token format. Use Bearer token.')
            
            token = auth_header.split(' ')[1]
            if not token:
                raise exceptions.AuthenticationFailed('No token provided')

            try:
                # Verify the Firebase token
                decoded_token = auth.verify_id_token(token)
                print("Token decoded successfully:", decoded_token)
            except Exception as e:
                print(f"Firebase token verification failed: {str(e)}")
                raise exceptions.AuthenticationFailed(f'Invalid Firebase token: {str(e)}')

            uid = decoded_token['uid']
            email = decoded_token.get('email', '')
            name = decoded_token.get('name', '')
            
            # Get or create user
            user, created = User.objects.get_or_create(
                username=uid,
                defaults={
                    'email': email,
                    'is_active': True,
                    'first_name': name.split()[0] if name else '',
                    'last_name': ' '.join(name.split()[1:]) if name and len(name.split()) > 1 else ''
                }
            )
            
            if created:
                print(f"Created new user with uid: {uid}")
                # Create profile for new user
                from .models import UserProfile
                UserProfile.objects.create(
                    user=user,
                    name=name or email.split('@')[0],
                    role='Team Member',
                    is_active=True
                )
            else:
                print(f"Found existing user with uid: {uid}")

            return (user, None)
            
        except exceptions.AuthenticationFailed as e:
            print(f"Authentication failed: {str(e)}")
            raise
        except Exception as e:
            print(f"Unexpected error during authentication: {str(e)}")
            raise exceptions.AuthenticationFailed(f'Authentication error: {str(e)}')
