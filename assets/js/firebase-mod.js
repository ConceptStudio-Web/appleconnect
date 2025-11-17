// Firebase modular SDK bootstrap for this site
// Exports initialized auth and firestore instances

import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB8ypyk8cqcsH16LBrnofu5dJxkexVtmRk",
  authDomain: "apple-connect-6f398.firebaseapp.com",
  projectId: "apple-connect-6f398",
  storageBucket: "apple-connect-6f398.firebasestorage.app",
  messagingSenderId: "348354519133",
  appId: "1:348354519133:web:49902ac172004c49736db4"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
