import {
  initializeApp,
  getApps,
  cert,
  type ServiceAccount,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let _db: Firestore | null = null;

/**
 * Lazy-initialize and return Firestore instance.
 * Prevents errors when env vars are missing at build time.
 */
export function getDb(): Firestore {
  if (_db) return _db;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin env vars not set: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY"
    );
  }

  try {
    if (getApps().length === 0) {
      const serviceAccount: ServiceAccount = {
        projectId,
        clientEmail,
        privateKey,
      };
      initializeApp({ credential: cert(serviceAccount) });
    }
    _db = getFirestore();
    return _db;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Firebase Admin initialization failed: ${message}`);
  }
}
