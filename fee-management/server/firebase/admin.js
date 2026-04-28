import admin from 'firebase-admin'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function loadServiceAccount() {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    }

    const configuredPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
      || './firebase/serviceAccountKey.json'
    const keyPath = path.isAbsolute(configuredPath)
      ? configuredPath
      : path.resolve(__dirname, '..', configuredPath.replace(/^\.\/?/, ''))

    return JSON.parse(fs.readFileSync(keyPath, 'utf8'))
  } catch (error) {
    console.error('Failed to load Firebase service account:', error.message)
    process.exit(1)
  }
}

function normalizeServiceAccount(serviceAccount) {
  if (!serviceAccount || serviceAccount.type !== 'service_account') {
    console.error('Invalid Firebase service account: expected a service_account JSON key file.')
    process.exit(1)
  }

  // Properly handle privateKey - convert escaped newlines to actual newlines
  if (typeof serviceAccount.private_key === 'string') {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n')
  }

  // Validate required fields
  const requiredFields = ['project_id', 'client_email', 'private_key']
  const missingFields = requiredFields.filter(field => !serviceAccount[field])
  
  if (missingFields.length > 0) {
    console.error(`Invalid Firebase service account: missing ${missingFields.join(', ')}`)
    process.exit(1)
  }

  return serviceAccount
}

const serviceAccount = normalizeServiceAccount(loadServiceAccount())

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  })
}

export const db = admin.firestore()
export default admin
