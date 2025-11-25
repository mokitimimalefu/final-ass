const admin = require('firebase-admin');

// Your Firebase configuration (same as frontend)
const firebaseConfig = {
  apiKey: "AIzaSyCghIkCF6-c_61XMakS6ptOJxIWgyL3MOc",
  authDomain: "group2-e1233.firebaseapp.com",
  projectId: "group2-e1233",
  storageBucket: "group2-e1233.firebasestorage.app",
  messagingSenderId: "998151977623",
  appId: "1:998151977623:web:e682c1c68c6f490836c7d2",
  measurementId: "G-YBQDHVHBBQ"
};

// Initialize Firebase Admin SDK with service account
// You need to download the service account key from Firebase Console
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  ...firebaseConfig
});

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

module.exports = { admin, db, auth, storage, firebaseConfig };