import firebase_admin
from firebase_admin import credentials, auth
from django.http import JsonResponse

# Initialize Firebase Admin SDK (this should be done once in your project setup)
cred = credentials.Certificate("FYPP/backend/firebase-credentials.json")
firebase_admin.initialize_app(cred)

def verify_token(request):
    try:
        token = request.headers.get('Authorization').split('Bearer ')[-1]
        decoded_token = auth.verify_id_token(token)  # Verifies the ID token
        uid = decoded_token['uid']  # Get the Firebase user ID
        return JsonResponse({'message': 'Token verified', 'uid': uid})
    except Exception as e:
        return JsonResponse({'message': 'Unauthorized', 'error': str(e)}, status=401)
