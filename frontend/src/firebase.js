// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCghIkCF6-c_61XMakS6ptOJxIWgyL3MOc",
  authDomain: "group2-e1233.firebaseapp.com",
  projectId: "group2-e1233",
  storageBucket: "group2-e1233.firebasestorage.app",
  messagingSenderId: "998151977623",
  appId: "1:998151977623:web:e682c1c68c6f490836c7d2",
  measurementId: "G-YBQDHVHBBQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

// Note: Firestore emulator connection removed to connect to live Firebase database
// If you want to use emulator in development, uncomment the code below and start the emulator:
// if (process.env.NODE_ENV === 'development') {
//   try {
//     connectFirestoreEmulator(db, 'localhost', 8080);
//   } catch (error) {
//     console.log('Firestore emulator already connected');
//   }
// }

export default app;
