import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDQCERqgfEr5cA0yWdw7sYXqQBJHg8Nq7o",
  authDomain: "apptaxi-7b560.firebaseapp.com",
  projectId: "apptaxi-7b560",
  storageBucket: "apptaxi-7b560.firebasestorage.app",
  messagingSenderId: "611230579350",
  appId: "1:611230579350:web:087423f945f09a246a20b7",
  measurementId: "G-QXE5F02924"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db }; 
""