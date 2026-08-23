import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// TODO: 填入你的 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCEqNyvMHsTiGu-8q3WoK1eBHWJaw8KCJA",
  authDomain: "gender-reveal-party-905de.firebaseapp.com",
  databaseURL: "https://gender-reveal-party-905de-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "gender-reveal-party-905de",
  storageBucket: "gender-reveal-party-905de.firebasestorage.app",
  messagingSenderId: "972856514197",
  appId: "1:972856514197:web:d18fd6e881e6992bdfad9c"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
