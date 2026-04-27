import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore'
import bcrypt from 'bcrypt'

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD-V9Vbb5o_Az9nCLsYHL4JGcY99gMDDcI",
  authDomain: "apts-1c2c3.firebaseapp.com",
  projectId: "apts-1c2c3",
  storageBucket: "apts-1c2c3.firebasestorage.app",
  messagingSenderId: "753875460593",
  appId: "1:753875460593:web:a6cbb69542ec9c63d2a450"
}

async function setupAdmin() {
  try {
    const app = initializeApp(firebaseConfig)
    const db = getFirestore(app)
    
    console.log('Admin Setup Script for Fee Manager')
    console.log('===================================\n')

    // Check if admin collection exists
    const adminSnapshot = await getDocs(collection(db, 'admin'))
    
    if (!adminSnapshot.empty) {
      console.log('Admin user already exists:')
      adminSnapshot.forEach(d => {
        console.log(`Email: ${d.data().email}`)
      })
      console.log('\nTo reset admin password, please manually update the admin document.')
      process.exit(0)
    }

    // Create default admin
    const defaultEmail = 'admin@feemgr.com'
    const defaultPassword = 'password1234'
    const passwordHash = await bcrypt.hash(defaultPassword, 10)

    await setDoc(doc(db, 'admin', 'default'), {
      email: defaultEmail,
      passwordHash: passwordHash,
      createdAt: new Date()
    })

    console.log('✓ Admin user created successfully!')
    console.log(`\nLogin Credentials:`)
    console.log(`Email: ${defaultEmail}`)
    console.log(`Password: ${defaultPassword}`)
    console.log('\n⚠️  IMPORTANT: Change the password immediately after first login!')
    
    process.exit(0)
  } catch (error) {
    console.error('Error setting up admin:', error.message)
    console.error('\nMake sure:')
    console.error('1. Firestore database is initialized in your Firebase project')
    console.error('2. You have proper Firebase permissions')
    process.exit(1)
  }
}

setupAdmin()
