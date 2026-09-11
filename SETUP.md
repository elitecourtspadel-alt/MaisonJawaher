# Setup Guide — Connecting the Admin Page

The site itself (`index.html`, `shop.html`) needs no setup — it's plain HTML/CSS/JS.
But the **admin page** (`admin.html`) needs a real database to save products to, so
that what you add in the admin shows up on the live site for everyone. This guide
gets that database running in about 5 minutes, for free.

## 1. Create a Firebase project

1. Go to **[console.firebase.google.com](https://console.firebase.google.com)** and sign in with any Google account.
2. Click **Add project**.
3. Name it something like `maison-jawaher` and click through the setup (you can
   turn off Google Analytics for this project — you don't need it).

## 2. Register a web app

1. On your new project's homepage, click the **`</>`** (web) icon to add a web app.
2. Give it a nickname (e.g. `maison-jawaher-site`) — you don't need Firebase Hosting.
3. Firebase will show you a code block that looks like this:

   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "maison-jawaher.firebaseapp.com",
     databaseURL: "https://maison-jawaher-default-rtdb.firebaseio.com",
     projectId: "maison-jawaher",
     storageBucket: "maison-jawaher.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef123456"
   };
   ```

4. Copy those six values into `firebase-config.js` in this project, replacing the
   `PASTE_YOUR_...` placeholders. Save the file.

## 3. Turn on the Realtime Database

1. In the left sidebar of the Firebase console, go to **Build → Realtime Database**.
2. Click **Create Database**.
3. Pick any location (closest to your customers is fine).
4. Choose **Start in test mode** for now — this lets the site read and write
   without requiring login, which is what these pages expect out of the box.
   **Read the security note below before you actually launch the site publicly.**

That's it — `admin.html`, `shop.html`, and the homepage's "New In" section will
now all read and write to this database.

## 4. Try it

1. Open `admin.html` in a browser (or push everything to GitHub and open
   `https://<you>.github.io/<repo>/admin.html`).
2. Add a product with a name, category, price, and an image URL.
3. Open `index.html` or `shop.html` — the product should appear within a
   couple of seconds.

## ⚠️ Security note — please read before launching

"Test mode" database rules mean **anyone who finds your `admin.html` URL can
add, edit, or delete products** — there's no password on this admin page,
matching how your other admin panels work. That's fine while you're setting
things up, but before sharing the site publicly, do one of these:

- **Simplest:** don't link to `admin.html` from anywhere public, and don't
  share the URL. This is "security by obscurity" — not real security, but
  it's the same approach your other admin panels use.
- **Better:** in the Firebase console, go to **Realtime Database → Rules**
  and tighten write access, e.g. requiring a specific secret in the request
  or switching to Firebase Authentication (email/password login) so only you
  can write. If you want, ask Claude to add a login screen to `admin.html`
  and set up matching database rules — that's a bigger change than test mode
  but worth it once real customers are visiting the site.

Either way, test-mode rules **expire automatically after 30 days** and the
database will stop accepting writes until you update the rules — so you'll
need to revisit this regardless.
