// Paste your Firebase web app config object into FIREBASE_CONFIG below.
// Example:
// window.FIREBASE_CONFIG = {
//   apiKey: "...",
//   authDomain: "...",
//   projectId: "...",
//   storageBucket: "...",
//   messagingSenderId: "...",
//   appId: "..."
// };

window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyB8ypyk8cqcsH16LBrnofu5dJxkexVtmRk",
  authDomain: "apple-connect-6f398.firebaseapp.com",
  projectId: "apple-connect-6f398",
  storageBucket: "apple-connect-6f398.firebasestorage.app",
  messagingSenderId: "348354519133",
  appId: "1:348354519133:web:49902ac172004c49736db4"
};

if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(window.FIREBASE_CONFIG);
}
