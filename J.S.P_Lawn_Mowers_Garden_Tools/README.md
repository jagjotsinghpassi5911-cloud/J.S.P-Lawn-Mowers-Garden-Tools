# J.S.P Lawn Mowers and Garden Tools

A responsive, frontend-only business website and catalogue. Exactly **four HTML pages**, with real product photographs downloaded from the company's official website.

## Start in two minutes

1. Extract the ZIP completely.
2. On Windows, double-click `START_WEBSITE.bat` if Python is installed. Open `http://localhost:8000`.
3. Alternatively, open the folder in VS Code, right-click `public/index.html`, and select **Open with Live Server**.
4. Or run `python -m http.server 8000 --directory public --bind 127.0.0.1` from this folder.

Use localhost or HTTPS for the login, which uses the browser's Web Crypto API. Opening `index.html` directly may display the pages, but browser storage and cryptography on `file://` vary between browsers.

## Pages

| File | Purpose |
| --- | --- |
| `public/index.html` | Homepage, categories, featured products and brand introduction |
| `public/products.html` | 15 products; search, category filters, sorting and product details |
| `public/about.html` | Company history, contact details, enquiry draft form and FAQs |
| `public/login.html` | Sign in, account creation, local profile, sign out and profile reset |

Contact and account sections stay inside these pages. No extra registration, cart, dashboard or contact page is created.

## Features

- Responsive desktop, tablet and mobile layouts.
- All photographs included locally; no hotlinking or generated product images.
- Search by product name, model number or published detail.
- Five category filters, alphabetical sorting and a clear empty state.
- Keyboard-accessible product dialogs with published model details.
- Enquiry list saved in the current browser; add, remove and download as text.
- Contact form prepares a reviewable email draft and downloadable `.txt` file.
- Click-to-call, email and Google Maps directions.
- Local account creation, password matching, sign-in, sign-out and reset.
- Skip link, labelled forms, visible keyboard focus, accessible dialogs and reduced-motion support.
- No framework, build step, CDN, third-party font, tracking script or paid service.

## What “frontend-only login” means

The profile is saved in this browser's `localStorage`. Passwords are stored as salted PBKDF2-SHA-256 hashes, not plaintext. Session state uses `sessionStorage`, or `localStorage` when “Keep me signed in” is selected. Sessions expire after one day or 30 days respectively.

**This is an educational UI interaction, not secure authentication.** Anyone with access to this browser can inspect or alter its storage, remove a profile or change local session state. There is no email verification, server-side authorization, remote password recovery, admin role or protected customer database. Use a unique practice password, never an existing real password. Do not collect real customer credentials.

The product enquiry list is shared by local profiles using the same browser. It does not sync across devices. The contact form does not submit data to a server; “Open email app” opens a draft, which the visitor must review and send themselves. For long drafts or when no email client is configured, use the text download and email it manually.

## Deploy with Firebase Hosting

The hosting configuration is already included in `firebase.json`. It publishes only the `public` folder. There are no Cloud Functions, database rules, Firebase Authentication SDKs or backend services.

1. Create a dedicated project at https://console.firebase.google.com/ using the no-cost Spark plan where available. Do not upgrade to a paid plan for this static site. Hosting quotas still apply.
2. Install Node.js LTS from https://nodejs.org/ if needed, then open a terminal in this extracted project folder.
3. Install and sign in to the official Firebase CLI:

   ```bash
   npm install -g firebase-tools
   firebase login
   firebase projects:list
   ```

4. Replace `YOUR_PROJECT_ID` below with the **project ID** shown by the CLI. Create or initialize the default Hosting site if prompted, then deploy:

   ```bash
   firebase deploy --only hosting --project YOUR_PROJECT_ID
   ```

5. Open the **Hosting URL printed by the CLI** and test all four pages. That confirmed URL is the one to submit. This package does not contain a deployed URL or a fabricated project ID.

If the CLI requires Hosting initialization, run `firebase init hosting`, select your dedicated project, use `public` as the public directory, answer **No** to the single-page-app rewrite question, **No** to GitHub automatic deploys, and **No** to overwriting any existing HTML file. Preserve the supplied `firebase.json` headers. Then run the deploy command again.

No Firebase web app registration, `firebaseConfig` object, script tag, API key, billing account or database is needed for this static Hosting project. If you choose a project that already hosts another website, deploying will replace that project's default site's content; use a dedicated project for this assignment.

Official instructions: https://firebase.google.com/docs/hosting/quickstart
CLI reference: https://firebase.google.com/docs/cli

## Editing the website

- Page wording: the four HTML files in `public`.
- Product names, model numbers and details: `public/assets/catalogue.js`.
- Colours, spacing and layouts: `public/assets/styles.css`.
- Product, filter and enquiry behaviour: `public/assets/app.js`.
- Local profile behaviour: `public/assets/auth.js`.
- Photos and their original URLs: `public/assets/images` and `public/assets/image-sources.json`.

Keep real prices and stock levels out of the catalogue until the business confirms them. The included site uses “Price on enquiry.”

## Submission topic

**J.S.P Lawn Mowers and Garden Tools — Frontend Business Website Redesign**

Business purpose: help customers explore the range, shortlist product models and prepare a product enquiry.

Technology: HTML5, CSS3 and JavaScript. Deployment target: Firebase Hosting. Backend: none.

J.S.P already has an official website, so this project is accurately described as a **redesign**. The supplied assignment prefers a business without a website. Confirm that your teacher accepts a redesign before submitting the topic. Enter your own correct name and roll number in the project sheet; this package does not submit that sheet.

## Source and image credits

Official company website: https://www.jspgardentools.in/

- Business history: https://www.jspgardentools.in/about.php
- Mower models: https://www.jspgardentools.in/lawn_mowers.php
- Garden accessories: https://www.jspgardentools.in/garden_tools.php
- Cutting tools: https://www.jspgardentools.in/garden_tools1.php
- Contact details: https://www.jspgardentools.in/contact.php

Information was checked on 26 October 2026. The current contact page/homepage gives the office postcode as 141013; an older about-page section gives 141003. This site uses the current contact listing. No opening hours, live prices, stock, performance ratings or customer testimonials have been invented.

The photographs come from the official website at the user's request; all image rights remain with their respective owners. The nursery photograph is contextual garden imagery from that site and is not proof of a particular J.S.P facility. Original download URLs are preserved in `image-sources.json`.

## Validation

Run `python validate.py` from this directory for the local page, link, asset and configuration checks, and `node --test tests/auth-check.cjs` for the local profile logic tests. Browser checks cover catalogue filtering, product dialogs, enquiry-list persistence, draft preparation, downloads and responsive layouts. See `QA_NOTES.md` for the recorded results and limitations.
