import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAR40o3E4lNHiGpMl8XO2bjXbvhUwMUYD4",
  authDomain: "my-diary-4c283.firebaseapp.com",
  projectId: "my-diary-4c283",
  storageBucket: "my-diary-4c283.appspot.com",
  messagingSenderId: "656604140818",
  appId: "1:656604140818:web:cf77015aa43e6dde144fcb",
  measurementId: "G-NVCKTNNHN5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

