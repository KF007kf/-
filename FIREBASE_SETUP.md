# Likes And Polls Setup

GitHub Pages can show files, but it cannot store visitor likes or votes by itself. This project already includes a Firebase Firestore layer for shared likes and polls.

## 1. Create Firebase

Create a Firebase project, add a Web App, then copy the Firebase config object.

## 2. Paste Config

Open:

```text
config/firebase-config.js
```

Replace `null` with your config:

```js
window.REVIEWFORK_FIREBASE_CONFIG = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

## 3. Enable Anonymous Auth

Firebase Console -> Authentication -> Sign-in method -> Anonymous -> Enable.

Visitors will not need accounts. Firebase gives each browser an anonymous id so one device keeps one like/vote state.

## 4. Create Firestore

Firebase Console -> Firestore Database -> Create database.

Use production mode, then paste these rules:

```text
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    match /reviewforkCounters/{docId} {
      allow read: if true;
      allow create, update: if signedIn();
    }

    match /reviewforkUsers/{userId}/{kind}/{docId} {
      allow read, write: if signedIn() && request.auth.uid == userId;
    }
  }
}
```

## 5. Publish

Commit and push the site to GitHub. After GitHub Pages deploys, all visitors will see the same like and poll totals.

This is a lightweight community layer, not an anti-abuse voting system. If the site grows, add Cloud Functions, rate limits, or captcha later.
