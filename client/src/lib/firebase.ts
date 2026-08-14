/* Independent stack: Firebase Spark + Google Auth + Firestore, no Manus dependency. */
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBeZ2eLK7iG1XBYNo0SytRfHGgUU3GTy50Q",
  authDomain: "vinyl-kallax.firebaseapp.com",
  projectId: "vinyl-kallax",
  storageBucket: "vinyl-kallax.firebasestorage.app",
  messagingSenderId: "518673688987",
  appId: "1:518673688987:web:63c58b6a80eefadfa993e",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
