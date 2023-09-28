import { initializeApp } from "firebase/app";
import { getFirestore, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// Varijable su ovdje prazne te ih trebate zamjeniti sa informacijom koju ste dobili nakon pokretanja svog firebase projekta
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export const auth = getAuth();

export { getDocs };
