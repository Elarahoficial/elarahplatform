import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDEt8eK9oIqe-L0e4nu4iPIz9RSv4b94e4",
  authDomain: "elarah-site.firebaseapp.com",
  projectId: "elarah-site",
  storageBucket: "elarah-site.firebasestorage.app",
  messagingSenderId: "180814732332",
  appId: "1:180814732332:web:49bdfee0f14e737cd24589",
  measurementId: "G-V0NS45LK77"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

window.ElarahFirebase = {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};
