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
  apiKey: "PASTE_YOUR_API_KEY_HERE",
  authDomain: "PASTE_YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://PASTE_YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "PASTE_YOUR_PROJECT_ID",
  storageBucket: "PASTE_YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "PASTE_YOUR_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID"
};

// Everything below this line you can leave alone.
let db;
try {
  if (typeof firebase === 'undefined') {
    throw new Error('Firebase SDK did not load — check your internet connection or ad-blocker.');
  }
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  db = firebase.database();
} catch (err) {
  console.error('Firebase did not initialize:', err.message);
  db = undefined;
}
