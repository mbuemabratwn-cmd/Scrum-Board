import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getDatabase, type Database } from 'firebase/database'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
}

export const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean)

let app: FirebaseApp | null = null
let db: Database | null = null
let auth: Auth | null = null

if (hasFirebaseConfig) {
  app = initializeApp(firebaseConfig)
  db = getDatabase(app)
  auth = getAuth(app)
  console.log('[firebase] connected')
} else {
  console.warn('[firebase] skipped: missing VITE_FIREBASE_* env vars')
}

export { app, auth, db }
