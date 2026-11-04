import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { firebaseConfig } from './firebase-config.ts';

function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Check if FIREBASE_SERVICE_ACCOUNT environment variable is provided
  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (serviceAccountEnv) {
    try {
      const serviceAccount = JSON.parse(serviceAccountEnv);
      return initializeApp({
        credential: cert(serviceAccount),
        projectId: firebaseConfig.projectId,
      });
    } catch (e) {
      console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT env var, falling back to default app initialization:', e);
    }
  }

  // Fallback initialization with explicit projectId (handles Render container environment without crashing)
  return initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

const app = getAdminApp();

export const adminAuth = getAuth(app);
