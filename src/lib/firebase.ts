import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfigLocal from '../../firebase-applet-config.json';

// Use environment variables if available (Vercel/Production), otherwise fallback to local config
const env = (import.meta as any).env || {};
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || firebaseConfigLocal.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigLocal.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || firebaseConfigLocal.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigLocal.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigLocal.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || firebaseConfigLocal.appId,
  firestoreDatabaseId: env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || firebaseConfigLocal.firestoreDatabaseId,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const signUpUser = async (name: string, email: string, pass: string) => {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: name });
    localStorage.setItem('apex_user', JSON.stringify({ name, email, uid: cred.user.uid }));
    return cred.user;
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      throw new Error("This email is already in use. Please log in instead.");
    }
    if (error.code === 'auth/weak-password') {
      throw new Error("Password should be at least 6 characters.");
    }
    if (error.code === 'auth/operation-not-allowed') {
      throw new Error("Email/Password Authentication is not enabled in Firebase Console.");
    }
    throw error;
  }
};

export const logInUser = async (email: string, pass: string) => {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    // Use displayName for name, fallback to storage if available
    const name = cred.user.displayName || "User";
    localStorage.setItem('apex_user', JSON.stringify({ name, email, uid: cred.user.uid }));
    return cred.user;
  } catch (error: any) {
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      throw new Error("Invalid email or password. Please check your credentials.");
    }
    throw error;
  }
};

// Validation check
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

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
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
