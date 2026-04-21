import firebase_admin
from firebase_admin import credentials
import os

cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "firebase-adminsdk.json")

if not firebase_admin._apps:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
