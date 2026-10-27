# Verification record

Checked on 26 October 2026.

## Passed

- Exactly four deliverable HTML pages, each with one primary H1.
- No duplicate page IDs; local links, fragment links, scripts, styles and image files resolved.
- 15 catalogue entries, 15 genuine product photographs and one nursery photograph, stored locally.
- JavaScript syntax checks for all three scripts.
- Desktop homepage and account-page visual inspection.
- All four pages checked inside 320, 390 and 768 CSS-pixel test frames. The frames' scrollbar-adjusted content widths were 305, 375 and 753 pixels. Horizontal document overflow was absent after fixing the narrow homepage headline.
- Mobile menu opens and exposes all four navigation destinations.
- Cutting-tools category shows four products; searching model 0072 narrows it to one.
- An unmatched query shows the empty state; clearing filters restores all 15 products.
- Alphabetical sorting verified.
- Product details show the corresponding model, picture and published information.
- Adding a product updates the enquiry list; selection persists between pages.
- Product-list text download verified against the selected model.
- Contact form includes selected products in a reviewable draft and encodes an email draft link. No message was sent during testing.
- Account page switches correctly between sign-in and account-creation forms.
- Five automated tests exercise the actual local authentication script with synthetic fixtures: creation and salted hashing; incorrect/correct sign-in and logout; duplicate-email and mismatch rejection; local reset without removing the enquiry list; unsupported context, damaged data and storage-failure handling.

## Re-run locally

```bash
python validate.py
node --check public/assets/app.js
node --check public/assets/auth.js
node --check public/assets/catalogue.js
node --test tests/auth-check.cjs
```

These checks require Python 3.9+ and a current Node.js version, with no additional packages. They are development checks, not runtime dependencies of the website.

## Limits

- This is a frontend-only project. The local profile is not secure authentication and must not be used for real customer passwords or confidential information.
- Credential behaviour was tested in a Node Web Crypto harness. User credential entry and a full login session were not exercised in the cloud-browser preview. Test the account flow on localhost or the final HTTPS Hosting URL before presenting it.
- Responsive frames verify layout, not every physical phone or browser.
- Current prices, inventory, delivery commitments and business opening hours were not supplied, so they are not claimed.
- Firebase deployment has not been performed because an authenticated Firebase connection/project was not available. The supplied configuration and instructions are ready; a public URL is not claimed.
- The project sheet was not submitted. Confirm the final project title and business description with the instructor before submission.

The temporary responsive test page is excluded from the deliverable. Browser test data and screenshots are not included in the website package.
