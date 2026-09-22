/**
 * RetroVault - Firebase Firestore Cloud Integration
 * Connects to Google Cloud Firestore when configured, providing real-time global database
 * sync with seamless fallback to local storage.
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  increment,
  query,
  orderBy
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let db = null;
let firebaseInitialized = false;

// Check if all essential keys exist
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    firebaseInitialized = true;
    console.log('%c[RetroVault] Firebase Cloud Database Connected successfully!', 'color: #00ff66; font-weight: bold;');
  } catch (error) {
    console.warn('[RetroVault] Firebase initialization failed, running in Local Mode:', error);
  }
} else {
  console.log('%c[RetroVault] Running in Local Storage Mode (Add Firebase keys to .env or Vercel Environment Variables to enable global cloud sync).', 'color: #ffb800;');
}

export function isFirebaseConfigured() {
  return firebaseInitialized && db !== null;
}

/**
 * Fetch all published apps from Firestore collection 'applications'
 */
export async function fetchRemoteApps() {
  if (!isFirebaseConfigured()) return null;

  try {
    const appsRef = collection(db, 'applications');
    const q = query(appsRef, orderBy('releaseDate', 'desc'));
    const snapshot = await getDocs(q);

    const apps = [];
    snapshot.forEach((docSnap) => {
      apps.push({ id: docSnap.id, ...docSnap.data() });
    });
    return apps;
  } catch (err) {
    console.error('Failed to fetch from Firestore:', err);
    return null;
  }
}

/**
 * Upload or update an application in Firestore
 */
export async function pushRemoteApp(app) {
  if (!isFirebaseConfigured()) return false;

  try {
    const appRef = doc(db, 'applications', app.id);
    await setDoc(appRef, app, { merge: true });
    return true;
  } catch (err) {
    console.error('Failed to push to Firestore:', err);
    return false;
  }
}

/**
 * Delete an application from Firestore
 */
export async function deleteRemoteApp(id) {
  if (!isFirebaseConfigured()) return false;

  try {
    const appRef = doc(db, 'applications', id);
    await deleteDoc(appRef);
    return true;
  } catch (err) {
    console.error('Failed to delete from Firestore:', err);
    return false;
  }
}

/**
 * Atomically increment download counter in Firestore
 */
export async function incrementRemoteDownload(id) {
  if (!isFirebaseConfigured()) return;

  try {
    const appRef = doc(db, 'applications', id);
    await updateDoc(appRef, {
      downloadsCount: increment(1)
    });
  } catch (err) {
    console.error('Failed to update download count on Firestore:', err);
  }
}
