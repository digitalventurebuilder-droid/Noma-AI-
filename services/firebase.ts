
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC_qcwGY0GMcf1zUNbL5hsQca__Tt5GNqA",
  authDomain: "noma-ai-4f56a.firebaseapp.com",
  projectId: "noma-ai-4f56a",
  storageBucket: "noma-ai-4f56a.firebasestorage.app",
  messagingSenderId: "457126410946",
  appId: "1:457126410946:web:911323caff0ea9d215d95b",
  measurementId: "G-C9PN0M5H5F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
