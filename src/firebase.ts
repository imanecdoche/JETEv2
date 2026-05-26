import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Detect whether the app has a valid Firebase configuration or a placeholder.
// Placeholder settings contain 'remixed' or invalid formats that will crash on init.
const isFirebaseConfigValid = firebaseConfig && 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'remixed-api-key' && 
  !firebaseConfig.apiKey.startsWith('remixed-') &&
  firebaseConfig.apiKey.startsWith('AIzaSy') &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== 'remixed-project-id';

export const isFirebasePlaceholder = !isFirebaseConfigValid;

let app: any = null;
let db: any = null;
let auth: any = null;

if (isFirebaseConfigValid) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    auth = getAuth(app);

    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code == 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
      } else if (err.code == 'unimplemented') {
        console.warn('The current browser does not support all of the features required to enable persistence');
      }
    });
  } catch (error) {
    console.warn('Silent fallback on Firebase initialization failure:', error);
    db = {} as any;
    auth = {} as any;
  }
} else {
  console.log('Firebase running in local/offline mode. Configuration key is missing or is dummy.');
  db = {} as any;
  auth = {} as any;
}

export { app, db, auth };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
