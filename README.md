# Maison Jawaher

Fine jewelry designed in Morocco, finished by hand. This is the marketing site
and product admin for Maison Jawaher.

## Structure

```
maison-jawaher/
├── index.html          Homepage
├── shop.html            Full product catalog, filterable by category
├── admin.html            Add / edit / delete products (unlisted — see SETUP.md)
├── styles.css            Shared design tokens, layout, and homepage styles
├── shop.css              Shop page styles
├── admin.css              Admin page styles
├── script.js              Homepage: mobile nav, newsletter form, "New In" feed
├── shop.js                Shop page: filtering and rendering
├── admin.js                Admin page: form handling, live product list
├── products.js             Shared data layer (used by all three pages above)
├── firebase-config.js       Your Firebase project details go here — see SETUP.md
├── SETUP.md                  Step-by-step: connect the admin page to a database
└── README.md
```

## First-time setup

The site displays fine as-is, but the admin page and the "New In" / shop
product feeds need a database to actually work. **Follow `SETUP.md`** —
it's a ~5 minute, no-cost Firebase setup with copy-paste steps.

## Running locally

No build tools needed — just open `index.html` in a browser, or serve it
locally for a closer-to-production feel:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploying with GitHub Pages

1. Push this folder to a GitHub repository.
2. In the repo, go to **Settings → Pages**.
3. Under **Source**, choose the branch (usually `main`) and the root folder (`/`).
4. Save — GitHub will publish the site at `https://<your-username>.github.io/<repo-name>/`.

If you'd rather serve it from the repo root at `https://<your-username>.github.io/`,
name the repository `<your-username>.github.io` and push these files to its root.

## Managing products

Open `admin.html` (locally or on your deployed site) to add, edit, or delete
products — name, category, price, image URL, description, whether it's
"in stock," and whether it shows in the homepage's "New In This Season"
section. Changes appear on `index.html` and `shop.html` within a few seconds,
no rebuild or redeploy needed.

**`admin.html` has no login** — same as your other admin panels, it relies on
the URL not being shared publicly. See the security note at the bottom of
`SETUP.md` before launching.

## Newsletter form

The subscribe form in the homepage footer is front-end only right now (it
just shows a confirmation message). To actually collect emails, wire the
`submit` handler in `script.js` up to your email provider (Mailchimp,
Klaviyo, ConvertKit, etc.) or a simple form backend like Formspree.
