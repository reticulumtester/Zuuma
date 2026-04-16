# Importing the Zuuma theme into Shopify

This repository is a Shopify Online Store 2.0 theme. To upload it:

## 1. Make a flat zip

Shopify rejects zips that nest everything inside a top-level folder (which is what GitHub's "Download ZIP" button produces). Create the zip from *inside* the repo so the folders (`layout/`, `sections/`, `assets/`, ...) sit at the root of the archive.

**macOS / Linux (from the repo root):**

```bash
zip -r zuuma-theme.zip . \
  -x ".git/*" "_reference/*" "*.DS_Store" "node_modules/*" "SHOPIFY_IMPORT.md"
```

**Windows (PowerShell, from the repo root):**

```powershell
Compress-Archive -Path layout,templates,sections,snippets,assets,config,locales -DestinationPath zuuma-theme.zip -Force
```

## 2. Upload to Shopify

1. Open your Shopify admin → **Online Store** → **Themes**.
2. Scroll down to **Theme library** → click **Add theme** → **Upload zip file**.
3. Pick `zuuma-theme.zip`.
4. Once uploaded, click **Actions** → **Preview** to see the homepage.
5. When you're happy, click **Actions** → **Publish**.

## 3. Link your real products

The bag, apron, and print sections render fine without any products wired up (they use static content + CTA links). To enable the real **Add to Cart** flow:

1. In Shopify admin, create the products: `Zuuma Bag`, `Zuuma Schürze`, `Palm Noir`, `Nocturnal Garden`, `Untitled No. 3`.
2. In **Online Store** → **Themes** → **Customize**, open the homepage.
3. For **Bag — Product** and **Apron — Product**, open the section settings and pick the matching product in the **Product** field.
4. Save. The button will now show the live price and post to `/cart/add.js` when clicked.

## 4. Replace placeholder imagery

The `assets/bag-0[1-5].jpg` files come from your pre-shoot photos. Once the real campaign is shot, replace them in Shopify admin → **Themes** → **Edit code** → **Assets**, or wire each section to a Shopify-hosted image via the **Hero bag image** / **Product image override** pickers.

## 5. Motion settings

Theme customizer → **Theme settings** → **Motion** lets you toggle:

- **Enable GSAP scrollytelling** — turn off to debug layout without any pinning.
- **Enable Lenis smooth scroll** — turn off to use native browser scroll.

Both are enabled by default and honour `prefers-reduced-motion`.
