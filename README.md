# Maison Jawaher

Fine jewelry designed in Morocco, finished by hand. This is the marketing site
for Maison Jawaher — a single-page static site, no build step required.

## Structure

```
maison-jawaher/
├── index.html    All page content and sections
├── styles.css    Design tokens, layout, and responsive styles
├── script.js     Mobile nav, newsletter form, footer year
└── README.md
```

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

## Editing content

Everything is in `index.html` — product names and prices live inside the
`#new-in` section, collection categories inside `#collections`, and the
brand story copy inside `#story`. Colors and type live at the top of
`styles.css` under `:root` if you want to adjust the palette.

## Newsletter form

The subscribe form in the footer is front-end only right now (it just shows
a confirmation message). To actually collect emails, wire the `submit`
handler in `script.js` up to your email provider (Mailchimp, Klaviyo,
ConvertKit, etc.) or a simple form backend like Formspree.
