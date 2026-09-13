// ============================================================================
// FIREBASE CONFIG — Maison Jawaher
// ============================================================================
// Fill in the 6 values below with your own Firebase project's config.
// Full setup instructions are in SETUP.md — short version:
//
//   1. Go to https://console.firebase.google.com and create a new project
//      (call it something like "maison-jawaher").
//   2. In the project, click the </> (web) icon to add a web app.
//      Name it anything (e.g. "maison-jawaher-site"), then copy the
//      firebaseConfig object it shows you into the six lines below.
//   3. In the left sidebar, go to Build → Realtime Database → Create Database.
//      Start in "test mode" for now (see SETUP.md for the security-rules
//      note before you actually launch).
//   4. Save this file, and admin.html / shop.html / index.html will all
//      start reading and writing to your database automatically.
// ============================================================================

const firebaseConfig = {
  apiKey: "AIzaSyBp_Qd-pl-i6O5MFiFDzfMUCi2zpW_uG5E",
  authDomain: "maison-jawaher.firebaseapp.com",
  databaseURL: "https://maison-jawaher-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "maison-jawaher",
  storageBucket: "maison-jawaher.firebasestorage.app",
  messagingSenderId: "70706209338",
  appId: "1:70706209338:web:54bc68a0ff05563b1bcb03"
};

// Everything below this line you can leave alone.
let db;
let auth;
let storage;
try {
  if (typeof firebase === 'undefined') {
    throw new Error('Firebase SDK did not load — check your internet connection or ad-blocker.');
  }
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  db = firebase.database();
  auth = firebase.auth();
  storage = firebase.storage();
} catch (err) {
  console.error('Firebase did not initialize:', err.message);
  db = undefined;
  auth = undefined;
  storage = undefined;
}
