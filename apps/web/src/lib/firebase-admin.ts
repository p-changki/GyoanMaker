import {
  getApp,
  initializeApp,
  getApps,
  cert,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

type StorageBucket = ReturnType<ReturnType<typeof getStorage>["bucket"]>;

// Use globalThis to survive HMR reloads in development
const globalForFirebase = globalThis as unknown as {
  _firebaseApp?: App;
  _firebaseDb?: Firestore;
  _firebaseBucket?: StorageBucket;
};

/**
 * Lazy-initialize and return Firestore instance.
 * Prevents errors when env vars are missing at build time.
 */
function getFirebaseAdminApp(): App {
  if (globalForFirebase._firebaseApp) return globalForFirebase._firebaseApp;
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
      initializeApp({
        credential: cert(serviceAccount),
        storageBucket:
          process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`,
      });
    }
    globalForFirebase._firebaseApp = getApp();
    return globalForFirebase._firebaseApp;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Firebase Admin initialization failed: ${message}`);
  }
}

export function getDb(): Firestore {
  if (globalForFirebase._firebaseDb) return globalForFirebase._firebaseDb;
  const db = getFirestore(getFirebaseAdminApp());
  db.settings({ ignoreUndefinedProperties: true });
  globalForFirebase._firebaseDb = db;
  return db;
}

export function getStorageBucket(): StorageBucket {
  if (globalForFirebase._firebaseBucket) return globalForFirebase._firebaseBucket;

  const app = getFirebaseAdminApp();
  const explicitBucket = process.env.FIREBASE_STORAGE_BUCKET;

  globalForFirebase._firebaseBucket = explicitBucket
    ? getStorage(app).bucket(explicitBucket)
    : getStorage(app).bucket();

  return globalForFirebase._firebaseBucket;
}
