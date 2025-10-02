import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCVE8cHf_ZEv_OOMVJuvD3-Xtc6gM9xmiY",
  authDomain: "homeplus-fb675.firebaseapp.com",
  projectId: "homeplus-fb675",
  storageBucket: "homeplus-fb675.firebasestorage.app",
  messagingSenderId: "193500211293",
  appId: "1:193500211293:web:d13dc8b57c623b10f285b4",
  measurementId: "G-T3RF260TK9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;