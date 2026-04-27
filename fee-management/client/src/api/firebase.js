import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyD-V9Vbb5o_Az9nCLsYHL4JGcY99gMDDcI',
  authDomain: 'apts-1c2c3.firebaseapp.com',
  projectId: 'apts-1c2c3',
  storageBucket: 'apts-1c2c3.firebasestorage.app',
  messagingSenderId: '753875460593',
  appId: '1:753875460593:web:a6cbb69542ec9c63d2a450'
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Services
export const db = getFirestore(app)
export const auth = getAuth(app)
export const storage = getStorage(app)

export default app
