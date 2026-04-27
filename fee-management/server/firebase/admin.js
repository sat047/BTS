import admin from 'firebase-admin'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config()

// Initialize Firebase Admin SDK
let serviceAccount
try {
  // Try to load from environment variable (for production/Render)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  } else {
    // Fall back to file path (for local development)
    const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase/serviceAccountKey.json'
    serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'))
  }
} catch (error) {
  console.error('Failed to load Firebase service account:', error.message)
  process.exit(1)
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

export const db = admin.firestore()
export default admin
