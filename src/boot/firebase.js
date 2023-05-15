import firebase from "firebase/app";
import "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAZ3MZpgnPbwJ5DyNJnC1wvriqjhHjjnsw",
  authDomain: "worldalert-23317.firebaseapp.com",
  projectId: "worldalert-23317",
  storageBucket: "worldalert-23317.appspot.com",
  messagingSenderId: "1017411475203",
  appId: "1:1017411475203:web:2b92b5051a241a3cddbb36",
  measurementId: "G-N5G39WWLG7",
};

firebase.initializeApp(firebaseConfig);

export const db = firebase.firestore();
