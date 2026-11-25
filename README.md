# Flori Cafe — Website (GitHub Pages / Vercel)

Static Arabic (RTL) Progressive Web App for **Flori Cafe (فلوري كافيه)** — zero build step.
Menu, offers, sauces, and delivery areas live in `js/menu-data.js`. The built-in admin panel commits changes straight to GitHub.

## 1) Deploy Online
1. Create a GitHub repository (e.g., `flori-cafe`).
2. Upload all files and folders (`index.html`, `css`, `js`, `img`, `icons`, `manifest.webmanifest`, `sw.js`, `.nojekyll`) to the root of the repo.
3. Either enable **GitHub Pages** (Settings → Pages → Branch `main` / root) or import the repo directly into **Vercel**.

## 2) Connect the Admin Panel to GitHub (one time)
1. GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate new token.
2. Repository access: *Only select repositories* → pick the Flori Cafe repo.
3. Permissions → **Contents: Read and write**. Copy the token.
4. Open the live site, scroll to the footer, and tap **©**.
5. Default admin password: `Flori2026`.
6. Open the **إعدادات GitHub** tab, verify owner/repo/branch, paste the token, and press **✏️ تحديث الموقع الآن**.
   - This saves `js/menu-data.js` and automatically replaces `__SITE_URL__` in `index.html` for WhatsApp/Facebook link previews.

## 3) Features Included
- **18 Categories, 181 Menu Items** transcribed from all 6 Flori Cafe menu sheets.
- **Instant Search** across Arabic & English names.
- **Café Customizations**: Sugar-level picker (`سادة / على الريحة / مظبوط / مانو / زيادة`) for coffee & hot drinks, dessert sauce picker for `(صوص)` and `ميكس` items, and priced extra sauces.
- **3 Order Modes** in Cart: Delivery (`توصيل`), Dine-in Table (`داخل الكافيه` with table number), and Takeaway (`تيك أواي`).
- **Editable Phone Number**: Change the main WhatsApp/order number (and an optional second phone number) anytime from the Admin Panel → **رقم الهاتف** tab, then press **✏️ تحديث الموقع الآن**.
- **Optional Firebase Firestore Sync**: Paste your Firebase project keys into `FB_CFG` in `js/app.js` to automatically save every web order to the `orders` collection.
- **Dark Mode + PWA**: Automatic system dark mode with manual toggle (`🌙`/`☀️`) and offline-capable installable app.

## 4) Changing Admin Password
Run:
```bash
echo -n "YourNewPassword" | sha256sum
```
Replace the `PH` value inside `js/app.js` with the resulting hash.
