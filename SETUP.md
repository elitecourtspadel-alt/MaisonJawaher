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

## 4. Turn on login for the admin page

The admin page now requires signing in with an email and password before it
shows anything or lets you save. Two steps to activate it:

### 4a. Turn on the Email/Password sign-in method

1. In the Firebase console, go to **Build → Authentication**.
2. Click **Get started**.
3. Click **Email/Password** in the list of providers, toggle it **on**, and
   click **Save**.

### 4b. Create your own login

1. Still in **Authentication**, go to the **Users** tab.
2. Click **Add user**.
3. Enter the email and password *you* want to sign in with on `admin.html`
   (this doesn't need to be a real inbox — it's just your login credential).
4. Click **Add user**.

That's your admin login now. Add more users here later if someone else
should also have access — there's no sign-up form on the site itself, so
only people you manually add in this Users tab can ever log in.

## 5. Turn on Storage for photo uploads

The admin page lets you upload product photos directly instead of pasting a
URL from somewhere else. That needs Firebase Storage turned on:

1. In the Firebase console, go to **Build → Storage**.
2. Click **Get started**.
3. Click through the prompts (default location is fine).
4. Choose **Start in test mode** for now — same as the database, you'll lock
   this down properly in the next step.

That's it — the "Choose Photo" button on `admin.html` will now upload
straight to your project and use the resulting link automatically. You can
still click "or paste an image URL instead" if you'd rather use an image
that's already hosted elsewhere.

## 6. Lock down the database and storage rules

By default, a brand-new Realtime Database *and* a brand-new Storage bucket
are both in "test mode," which lets *anyone* read and write your data — no
login required — regardless of the login screen on `admin.html` (the login
screen alone is just a UI gate; these rules are what actually enforce it).
Fix both:

### 6a. Database rules

1. In the Firebase console, go to **Build → Realtime Database → Rules**.
2. Replace whatever is there with:

   ```json
   {
     "rules": {
       "maison_jawaher": {
         "products": {
           ".read": true,
           ".write": "auth != null"
         }
       }
     }
   }
   ```

3. Click **Publish**.

### 6b. Storage rules

1. In the Firebase console, go to **Build → Storage → Rules**.
2. Replace whatever is there with:

   ```
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /maison_jawaher/products/{fileName} {
         allow read: if true;
         allow write: if request.auth != null
                      && request.resource.size < 5 * 1024 * 1024
                      && request.resource.contentType.matches('image/.*');
       }
     }
   }
   ```

3. Click **Publish**.

Together, these keep products and photos publicly *readable* (so
`index.html` and `shop.html` can display them to visitors without logging
in) but only *writable/uploadable* by someone signed in — i.e., only
through `admin.html` after entering the email/password you created in step
4b. The storage rule also rejects anything over 5MB or that isn't an image,
as a bit of extra safety on top of the same checks already built into the
admin page.

## 7. Try it

1. Open `admin.html` in a browser (or push everything to GitHub and open
   `https://<you>.github.io/<repo>/admin.html`).
2. Sign in with the email/password you created in step 4b.
3. Add a product with a name, category, price, and a photo (or a pasted URL).
4. Open `index.html` or `shop.html` — the product should appear within a
   couple of seconds, no login needed there.

## Notes on this setup

- **Forgot your password?** Firebase Authentication has no built-in "forgot
  password" flow wired up on this page. Reset it manually in the Firebase
  console under **Authentication → Users** (click the user → reset password),
  or delete and re-add the user with a new password.
- **This is real protection, not just obscurity** — as long as you complete
  step 6. If you skip it and leave things in test mode, the login screen is
  cosmetic only: anyone who finds your Firebase project's API details could
  still write to the database or storage directly, bypassing `admin.html`
  entirely.
- Test-mode rules (for both database and storage, if you haven't replaced
  them yet) **expire automatically after 30 days**, after which they stop
  accepting *any* reads or writes — including from the public site — until
  you publish real rules like the ones in step 6.
- **Uploaded photos aren't automatically deleted** when you delete a product
  or replace its photo — they just stop being linked to anything. This
  won't cost you anything meaningful at small scale (Firebase Storage's
  free tier is 5GB), but if you want cleanup automation later, that's a
  small addition Claude can make to `admin.js`.
