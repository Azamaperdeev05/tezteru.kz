# 🔥 Firebase & Google One Tap Setup Guide

Бұл құжат **tezteru.kz** жобасында Firebase қызметтерін және Google One Tap авторизациясын қалай баптау керектігін түсіндіреді.

## 1. Firebase жобасын құру

1. [Firebase Console](https://console.firebase.google.com/)-ға өтіп, жаңа жоба қосыңыз.
2. **Authentication** бөліміне өтіп, келесі провайдерлерді қосыңыз:
    * **Google** (міндетті)
    * **Email/Password**
    * **Anonymous** (таңдаулы)
3. **Firestore Database** қосыңыз және "Production mode" немесе "Test mode" таңдаңыз.
4. **Жоба баптауларынан** (Project Settings) **Web App** қосып, SDK конфигурациясын алыңыз.

## 2. Орталық айнымалылар (.env)

Жобаның түбірінде `.env` файлын құрып, келесі мәліметтерді толтырыңыз:

```env
VITE_FIREBASE_API_KEY=сіздің_api_key
VITE_FIREBASE_AUTH_DOMAIN=сіздің_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=сіздің_project_id
VITE_FIREBASE_STORAGE_BUCKET=сіздің_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=сіздің_sender_id
VITE_FIREBASE_APP_ID=сіздің_app_id
VITE_FIREBASE_DATABASE_ID=(default)
VITE_GOOGLE_CLIENT_ID=сіздің_google_web_client_id
```

## 3. Google One Tap баптауы

Google One Tap жұмыс істеуі үшін **Web Client ID** қажет.

1. Firebase-те Google-ді қосқанда, ол автоматты түрде **Web Client ID** жасайды.
2. Оны [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials) бөлімінен табыңыз.
3. **Authorized JavaScript origins** бөліміне келесілерді қосыңыз:
    * `http://localhost:5173` (локалды әзірлеу үшін)
    * `https://tezteru.kz` (продакшн үшін)

## 4. Firestore қауіпсіздік ережелері

`firestore.rules` файлындағы ережелерді қолданыңыз:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /scores/{scoreId} {
      allow read: if true;
      allow create: if request.auth != null;
    }
  }
}
```

---
Қосымша сұрақтар бойынша [README.md](../README.md) файлын қараңыз.
