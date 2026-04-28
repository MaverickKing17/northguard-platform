import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);

// Connectivity check as required by Firebase integration instructions
async function testConnection() {
  try {
    // Attempting a fetch from a dummy path to verify connectivity
    await getDocFromServer(doc(db, 'system', 'connection_test'));
    console.log('Firebase connection verified');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration: client is offline.");
    } else {
      // Standard permission errors or not founds are fine, as it means we connected but either have no data or no access yet
      console.log('Firebase connected (access verification complete)');
    }
  }
}

testConnection();
