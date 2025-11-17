# Apple Connect Website

A fast, responsive, mobile-first site for Apple Connect — Bulawayo's leading iPhone reseller. Showcases iPhones (13–17), MacBooks, and accessories with sections for Hot Deals, Quick Sales, and New Stock.

## Project Structure

- `index.html` — Main page with sections.
- `assets/css/styles.css` — Mobile-first design using white primary and a neutral blue accent.
- `assets/js/app.js` — Loads and renders products from `data/products.json`, filters, and scroller controls.
- `data/products.json` — Sample product data and specs: model, condition, TrueTone, Face ID, battery health, storage, price.

## Run Locally

This is a static site.

- Option 1: Open `index.html` directly in your browser.
- Option 2: Use a local server for best results:
  - VS Code Live Server, or
  - Python: `python -m http.server` (then open http://localhost:8000)

## Customization

- Add/edit products in `data/products.json`.
- Change accent color in `assets/css/styles.css` under `--accent`.
- Update contact links (WhatsApp/Call) in `index.html` footer.

## Recommended Next Steps

- Set `C:\Users\marke\CascadeProjects\apple-connect-site` as your active workspace.
- Replace placeholder images by setting `image` URLs in `data/products.json`.
- Add SEO: custom title/description per product if you build a multi-page setup later.
