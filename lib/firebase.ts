import {getApp, getApps, initializeApp} from 'firebase/app';
import {getAuth, GoogleAuthProvider} from 'firebase/auth';
import {getFirestore} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBHtrJn_HyICht4wQOh7uVF4_LpWcnkkY8',
  authDomain: 'girokham-1.firebaseapp.com',
  projectId: 'girokham-1',
  storageBucket: 'girokham-1.firebasestorage.app',
  messagingSenderId: '157059339735',
  appId: '1:157059339735:web:ed73d7bc9e9987f57ca792',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({prompt: 'select_account'});
