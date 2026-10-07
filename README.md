# Maison Jawaher

Bilingual (English / Français) jewelry shop for Morocco. Built with Next.js 16, Tailwind 4 and Motion. It runs on **Supabase** (production) or in **test mode** (no Supabase needed).

## Two run modes

| | **test** | **supabase** |
|---|---|---|
| Set in `.env.local` | `APP_MODE=test` | `APP_MODE=supabase` and the Supabase keys |
| Data | a local file, `.data/db.json`, filled with sample products on first start | Supabase Postgres |
| Images | `.data/uploads/` | Supabase Storage bucket `media` |
| Admin sign-in and 2FA | built in | Supabase Auth and MFA |

Test mode is for trying things out. Use Supabase for the real site: `.data/` is not backed up and is lost on most hosts.
If `APP_MODE` is not set, Supabase is used when its URL is configured, otherwise test mode.

## Getting started

1. Copy `.env.example` to `.env.local` and set `APP_MODE`. For Supabase also fill in the URL, anon key, service-role key, `SUPABASE_DB_URL` (Project Settings, Database, Connection string) and a long random `APP_SECRET`. In Supabase, turn off "Allow new users to sign up".
2. **Supabase only:** run **`setup-fresh.bat`**. It creates the tables, loads the sample data and sets up the image bucket (see below). In test mode this step is not needed.
3. Run **`create-admin.bat`** and follow the prompts to create your admin (choose role 1, Super Administrator, for the owner).
4. Run **`start-app.bat`** and open http://localhost:3001. Sign in at `/admin`. Under **Security & 2FA** you can turn on authenticator-app 2FA if you want it.

## The batch files

| File | What it does |
|---|---|
| `setup-fresh.bat` | Starts from zero: removes old tables if they exist, creates every table in order, loads the seed data, empties image storage. Safe when tables are missing. Asks you to type YES first. |
| `clear-data.bat` | Removes the shop's own data (products, categories, slides, FAQs, announcements, orders, messages, audit history, uploaded images). Keeps admin users, roles, privileges, languages and settings. Asks you to type YES first. |
| `create-admin.bat` | Creates an admin, or resets the password and role of an existing one. |
| `create-admin-production.bat` | Selects production by default, requires confirmation, and creates an admin with a one-use temporary password and mandatory 2FA. |

## The database scripts (`supabase/sql`)

Schema files and seed files live in one folder and run strictly in numbered order (`setup-fresh.bat`, or paste them one by one into the Supabase SQL Editor). Files ending in `_seed.sql` hold sample data: setup loads them, `db:migrate` skips them.

| Script | Contents |
|---|---|
| `00_basic_setup.sql` / `01_basic_setup_seed.sql` | extensions, `app_users`, recovery and trusted devices, roles and privileges / the privileges, roles and role mapping |
| `02_languages.sql` / `03_languages_seed.sql` | `languages` |
| `04_categories.sql` / `05_categories_seed.sql` | categories and translations |
| `06_products.sql` / `07_products_seed.sql` | products, images, sections and translations |
| `08_slides.sql` | collection slider |
| `09_faqs.sql` / `10_faqs_seed.sql` | FAQs |
| `11_announcements.sql` / `12_announcements_seed.sql` | announcements |
| `13_settings.sql` / `14_settings_seed.sql` | `site_settings`, `private_settings` |
| `15_orders_messages.sql`, `16_audit_log.sql` | orders, messages, audit log |
| `17_security_and_storage.sql` | row level security and the `media` bucket |

New feature: add the next pair of numbers (`18_thing.sql`, `19_thing_seed.sql`). `maintenance/` holds the reset scripts used by the batch files.

**Images** are served from the `media` bucket's public URLs (cached by the CDN, so they stay fast). There is no storage policy for visitors or signed-in users: nobody can list, upload, replace or delete files with the public key; only the server writes, after checking the admin's privileges. File names are random.

## Admin portal address

The admin lives at `NEXT_PUBLIC_ADMIN_PATH` (set per environment in `config/*.env`, for example `/portal-3f9a1c`). A plain `/admin` returns 404 and the portal's address is not in `robots.txt` or the sitemap; its pages send `noindex, nofollow`. Change the value and restart. `create-admin.bat` is a development tool (fixed dev admin, 2FA off, refuses production); use `create-admin-production.bat` for production.


Content tables have the same five columns: `is_active`, `created_by`, `created_at`, `updated_by`, `updated_at`. The two `_by` columns are filled with the admin who made the change, `updated_at` is kept current by a trigger, and `is_active` switches a row on or off (inactive rows are hidden from the website). Internal recovery and migration tables use their own fields.

## Roles and privileges

Each part of the portal has privileges: **view**, **add**, **update**, **turn on/off** and **delete** (orders and messages have view, update and delete; settings has view and update; the audit history has view). A role is a set of privileges and a user can have several roles. Seeded roles: Super Administrator, Store Manager, Content Editor, Order Handler, Viewer. For now users are created only with `create-admin.bat`; the portal hides what a role cannot do and the server refuses it as well.

## Languages

Wording for categories, products, slides, FAQs and announcements is stored per language (`*_translations` tables), not in fixed English/French columns. The admin forms show one tab per active language and only the main language (French) is required; other languages fall back to it. To add a language: add a row in `languages`, add a dictionary file under `src/messages` and add its code to `locales` in `src/lib/i18n.ts`.

## Good to know

- Turning a **category** off hides all of its products from the website. A category that still has products cannot be deleted.
- The **audit history** page lists who changed what, and when, in plain sentences.
- Announcements (the scrolling bar under the menu) are managed under **Announcements**.
- Settings include showing or hiding **prices**, the shop **location**, opening hours, the WhatsApp number and community link, social links, and the email switches (see below).
- Checkout is cash on delivery with WhatsApp confirmation (no online payment).
- The contact and order forms use a hidden honeypot field, a minimum-fill-time check and a per-IP rate limit.
- For production set `NEXT_PUBLIC_SITE_URL` to your domain and a strong `APP_SECRET`.

## Admin sessions and photos

Admin **Settings > Security** stores `admin_idle_timeout_minutes` in `site_settings.data` (default 30, range 5–240). A one-minute warning offers **Stay signed in**. Activity renews a signed, HTTP-only cookie; pages and actions reject expired sessions on the server, with a 12-hour maximum session lifetime. Existing signed-in admins must sign in again after this update. The default is included in `supabase/sql/seeds/09_settings.sql`; `supabase/sql/09_settings.sql` adds it to an existing settings row only when absent. Apply the regular schema using `npm run db:migrate -- --env dev`; customized timeouts are preserved.

Slides always need photos; active products and categories need photos, while inactive drafts may be saved without them. Photo crosses edit the form: saved photos are removed only after **Save**. Storage deletion checks references across products, categories and slides, and reports cleanup failures. New uploads use per-admin folders. Abandoned uploads older than 24 hours are cleaned on that admin's next upload; saved/shared photos are retained. No recurring cleanup scheduler is required, but abandoned files remain until another upload happens.

## Daily Supabase keep-alive on Vercel

`vercel.json` defines one daily job at **06:17 UTC** calling `/api/cron/supabase-keepalive`. In Vercel's production environment, set a long random **CRON_SECRET**, along with the existing Supabase environment variables and `APP_MODE=supabase`, then deploy. Vercel sends `Authorization: Bearer <CRON_SECRET>` automatically; unauthenticated requests are rejected. The job makes a small, uncached read from `site_settings`, never changes shop data, and skips local test mode. Check its run history under Vercel Cron Jobs. Hobby plans may run within the scheduled hour.

The schedule becomes active only after deployment and secret configuration. A daily database read can help avoid inactivity, but does not guarantee Supabase Free projects will never pause; it also cannot resume a project that has already paused. Resume such a project in Supabase first.

## Email

The mail server is set in the environment (`.env.local` or your host's settings), **not** in the portal: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM_EMAIL`, `MAIL_FROM_NAME`. Without `SMTP_HOST` nothing is sent.
In **Settings > Email** the portal only chooses what is sent: a master on/off switch, alerts to the admin address (new orders and messages), an order confirmation to customers who gave an email, the admin address and the language of the admin alerts. It also has a "send a test email" button and shows whether the server is set up.
Every order sends one email to the shop and one to the customer, each in the right language (English or French). The wording and layout are in `src/lib/email/templates.ts`.

## Analytics

Set `GA_MEASUREMENT_ID` (for example `G-ABC123XYZ`) to switch Google Analytics 4 on for the public site. Leave it empty in development and staging. IP addresses are anonymised and advertising features are off.

## Language by location

The first time someone opens the site without a `/fr` or `/en` address, they get French from Morocco and French-speaking countries and English from everywhere else. The country comes from the host's header (`x-vercel-ip-country`, `cf-ipcountry`, `cloudfront-viewer-country`, ...). When there is none (local development) the browser language is used. A language picked in the header menu is remembered and always wins. The list of countries is `FRENCH_COUNTRIES` in `src/lib/i18n.ts`.

## Policy pages

`/privacy` and `/terms` (in both languages) are written in `src/messages/legal.ts` and linked from the footer and the order form. Read them once and adjust anything that does not match how you really work (return period, delivery details, data you keep).

## Configuration profiles

The current Supabase project is **development**. Its existing settings are in the private `config/dev.env`; `.env.local` selects it with `APP_ENV=dev`. Configuration files containing secrets are ignored by Git. For production, copy `config/prod.env.example` to `config/prod.env` and fill in the separate production project, email and site settings. Do not reuse development secrets in production.

Select a profile in `.env.local`, or override it for one command:

```text
start-app.bat --env dev
create-admin.bat --env dev
setup-fresh.bat --env dev
clear-data.bat --env dev
npm run db:check -- --env dev
npm run db:migrate -- --env dev
npm run build -- --env prod
npm run start -- --env prod
```

Every tool prints the selected environment before doing work. `--env` takes precedence over `APP_ENV`; externally supplied variables take precedence over file values. Missing keys in a selected profile stay empty instead of borrowing another project's settings. Build again when switching the public Supabase project, site URL or application mode; public values are compiled into the browser bundle, and production start rejects a mismatched build.

On Vercel, configure the variables separately for Development, Preview and Production in the project dashboard, `APP_ENV` is optional on Vercel: leave it unset when supplying configuration directly in the dashboard. Private local files are not required on Vercel. Set production credentials only in Production. Use a separate Supabase project for each environment.

## Database setup and connection problems

`npm run db:check -- --env dev` checks connectivity without changing data. Database commands use the **Session pooler** URI from Supabase's Connect dialog (IPv4, port 5432); the transaction pooler on port 6543 is rejected for these maintenance commands. If your certificate requires a CA file, set `SUPABASE_DB_CA_CERT` to its path. Certificate verification remains enabled.

Fresh setup checks connectivity before asking for confirmation or deleting anything. Table creation and sample-data changes run in a transaction and roll back on failure. Storage operations are separate from that transaction. A timeout means the database cannot be reached: check whether the project is paused, verify the connection URI, and check your network/firewall/VPN. The current development connection still times out on port 5432. A code change cannot unblock that network connection. Use an allowed network, or run the SQL files in the Supabase SQL Editor in the documented order.

For an existing database, use `npm run db:migrate -- --env dev` to apply the regular numbered schema files without resetting shop data or loading sample seeds. These files use idempotent definitions and are shared with fresh setup; there is no separate migration folder. Before a production migration, take a database backup. Fresh setup remains a destructive reset and requires typing YES; it removes application admin access records, while Supabase Auth accounts remain and can be linked again using create-admin.

## Empty or unfinished Supabase stores

When Supabase mode is selected, the public site and login screen explain missing configuration, missing tables, an empty product catalog or a connection problem in ordinary language. Sign-in stays unavailable until the database is ready. An empty catalog does not prevent configured administrators from signing in to add products. No test catalog is substituted for a Supabase database.

## Admin password recovery

The login screen has a light/dark/system selector and **Forgot your password?**. Configure SMTP first. Recovery sends an active administrator a random temporary password valid for **15 minutes**, using the branded HTML and plain-text email templates. A temporary-password login only opens the permanent-password form; it does not grant portal access. Set a new password of at least 12 characters, then sign in normally, including any configured two-factor authentication.

Temporary passwords are stored only as hashes, expire, and can be redeemed once. Recovery requests return the same acknowledgement for known and unknown accounts. Requests have IP limits and a persistent five-minute per-account cooldown. A password-change notification is sent after success. Security emails are independent of optional order/contact notification switches. Existing order, customer confirmation, contact alert and test-mail templates remain available.

Password recovery is included in `supabase/sql/01_users.sql` for both new and existing installations. Apply the regular schema with `npm run db:migrate -- --env dev` on an existing database. SMTP delivery and live Supabase recovery still need verification after database connectivity and migration are available.

## Homepage background photo

In **Admin > Home hero**, upload, replace or remove the optional background photo, then save. The centered logo, headline, description and buttons remain unchanged. A burgundy overlay keeps them readable; removing the photo restores the original burgundy background. Use a high-resolution landscape photo because the responsive background fills the hero and may crop its edges. Saved image references are checked during cleanup so shared photos are retained.

## Public presentation

Product prices are hidden by default (`show_prices=false`) in both application defaults and new database seeds. Existing explicit admin choices are preserved; switch off Show prices in Settings > General to hide prices in an already configured store.

Homepage category cards show four per desktop row and five on wider screens when more than four categories exist. All categories remain reachable with the scroll arrows, keyboard or touch swipe; smaller screens show fewer, larger cards. Shop category filters also scroll with arrows when needed.

## Batch-file environment confirmation

Every batch file displays the selected environment, configuration filename, data source and target before starting the requested operation. It describes what will change and how to choose another profile. No keys or passwords are printed.

Profiles named `prod`, `production`, or beginning with `prod-`, `prod_`, `production-` or `production_` require typing **PRODUCTION** exactly in an interactive terminal. Cancelling prevents the requested operation from starting. Piped input and `--yes` cannot bypass this check. Production fresh setup and clear-data also retain their separate **YES** data-loss confirmation; `--yes` is ignored for those operations in production. The batch file preserves failure/cancellation exit codes.

This guard applies to local batch files. Vercel builds use their configured dashboard variables directly and do not prompt interactively. `start-app.bat` starts a local preview; selecting production connects that preview to real production data.

### Secure production admin creation

Run `create-admin-production.bat` after configuring `config/prod.env` and applying the regular schema. The tool shows the environment and target, then requires typing **PRODUCTION** before proceeding. It asks for email, name and role; it never asks for a password. Use `--env dev` explicitly to try this flow against development instead.

The generated password is valid **once for 15 minutes**. It grants only permission to choose a permanent password, never portal access. After choosing that password, the admin signs in again and must set up and verify an authenticator app before entering the portal. Each subsequent sign-in requires a code unless the browser has valid trusted-device permission, and this account cannot turn off 2FA through the portal. Existing verified 2FA is preserved when reissuing an invitation.

If `SMTP_HOST` and a sender (`MAIL_FROM_EMAIL` or `SMTP_USER`) are configured, the branded invitation is emailed and its password is not printed. With no SMTP host, the batch window displays the temporary password for private delivery. If SMTP delivery fails, the tool reports the failure without exposing the password. Correct the mail configuration and run `create-admin-production.bat --reissue` to issue a fresh invitation. `--reissue` also replaces the selected account's password and role, so use it only deliberately. Reissuing invalidates the previous invitation.

Existing databases need `npm run db:migrate -- --env prod` to add the account policy columns in `supabase/sql/01_users.sql`; back up production first. Fresh setup already includes these columns. Do not run a fresh setup just to apply this update. The original `create-admin.bat` keeps manual password entry and optional 2FA for its ordinary accounts. It does not downgrade the mandatory policy of an account created with the production tool.

### Trusted admin devices

**Settings > Security** controls trusted devices: enabled by default, **30 days** per browser and **2 devices per admin**. The period supports 1–90 days and the limit supports 1–10 devices. After a successful authenticator code (including initial 2FA enrollment), the admin can choose **Trust this device**. This option starts unchecked. When the limit has been reached, a confirmation names the least recently used device before replacing it. Cancelling leaves every existing device untouched and signs in without saving the new browser. Renewing trust on the same browser does not consume another slot.

**Security & 2FA** lists the admin's own trusted browsers, last use, expiry and current browser, with actions to remove one or all. Password sign-in remains required. Trust only skips the code prompt; it does not bypass the idle timeout, extend the 12-hour sign-in session, grant roles or skip mandatory first-time 2FA enrollment. Trust survives ordinary sign-out, but expiration, revocation, password reset, production invitation reissue and 2FA changes invalidate it. A fresh authenticator code is required before changing 2FA or saving/renewing trust after a trusted-device sign-in.

Trust is scoped to a browser cookie, not a physical computer: private browsing, clearing cookies or switching browsers will require another code. Random tokens are stored in HTTP-only cookies (Secure in Supabase production), and only keyed hashes are saved in the private database table. The server checks ownership, the verified factor, account security state and expiry on each request. Registering devices is serialized per admin in SQL, and reaching the cap never silently evicts a device without confirmation. Shortening the period or reducing the device cap applies immediately; disabling trusted devices removes all stored grants, so re-enabling cannot restore them.

The table and private database functions are included in `supabase/sql/01_users.sql`, and defaults are included in the settings schema and seeds. For an existing development database, apply `npm run db:migrate -- --env dev`; for production, use `--env prod` after taking a backup. This is a regular migration, not a fresh reset. Live Supabase and SMTP were not used by the isolated verification tests.
