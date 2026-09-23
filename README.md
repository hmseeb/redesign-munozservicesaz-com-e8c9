# Muñoz Services LLC — Website

A complete redesign of the Muñoz Services LLC site: a locally owned air duct cleaning
company serving Arizona.

Built as a static site with **vanilla HTML, CSS and JavaScript** — no build step and no
dependencies. The only server-side piece is a single serverless function that forwards
contact form submissions to GoHighLevel.

## Files

| File           | Purpose                                                        |
| -------------- | -------------------------------------------------------------- |
| `index.html`   | Entry point — the full single-page site                         |
| `styles.css`   | All styling, design tokens and responsive rules                 |
| `script.js`    | Navigation, scroll reveals, gallery lightbox, form validation   |
| `api/lead.js`  | Serverless function — sends form submissions to GoHighLevel      |
| `favicon.svg`  | Site icon, drawn from the company logo mark                     |
| `robots.txt`   | Crawler directives                                              |
| `sitemap.xml`  | Sitemap                                                         |

## Running it

No tooling required — open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

## Design

The palette is sampled directly from the company's own logo artwork, so the logo sits
seamlessly on the header and footer:

| Token            | Value     | Source                    |
| ---------------- | --------- | ------------------------- |
| Panel navy       | `#091722` | logo background           |
| Sunset (deep)    | `#BB4825` | top of the logo's arc     |
| Sunset (warm)    | `#DF802C` | base of the logo's arc    |
| Cream            | `#FDD99D` | logo wordmark             |

Type is Oswald (condensed display, matching the wordmark) over Inter for body copy.
The hero repeats the logo's motif — a sunset arc behind a desert ridge lined with
radio towers.

## Sections

Header/utility bar · Hero · Service ticker · Services · Why Us · Before &amp; After ·
About · Gallery · Call to action · Contact · Footer

## Images

Every photograph of actual work is an original image from the business — real
before/after shots from Muñoz Services jobs (duct interiors, flex duct, blower wheels,
air handler cabinets, dryer vent lint, sanitizing equipment on site). These are served
from the company's existing CDN and were deliberately preserved rather than replaced
with stock.

The single exception is the About section portrait, which is a licensed Pexels photo
used because no original photo of the team exists.

## Contact

- **Phone:** 623-324-6165
- **Email:** munozservices00@gmail.com
- **Hours:** Mon – Sat, 8:00 AM – 8:00 PM · Sunday closed
- **Service area:** Arizona

## Contact form → GoHighLevel

The contact form validates client-side and then POSTs to `/api/lead`, which upserts the
visitor into the GoHighLevel sub-account `TKJLNcpwEgvwUFshHw6b`:

- First name / last name (split from the single Name field), email and phone
- Custom field **Lead Source** → `Website`
- Custom field **Website Form** → the submitting form's `data-form-name`
- Tag **`website-lead`**
- The message is attached to the contact as a note

Either custom field is created automatically in the sub-account if it does not exist yet.
On success the form resets and shows its thank-you message in place.

### Required configuration

The GoHighLevel token is secret and is read server-side only — it is never exposed to the
browser. Set this environment variable in the hosting project (Vercel → Settings →
Environment Variables) before the form can deliver leads:

| Variable          | Value                                                    |
| ----------------- | -------------------------------------------------------- |
| `GHL_API_KEY`     | Private Integration token for the sub-account             |
| `GHL_LOCATION_ID` | *(optional)* overrides the default location id            |

The token needs the scopes `contacts.write`, `contacts.readonly`,
`locations/customFields.write` and `locations/customFields.readonly`.

To add another form later, give it `data-form-name="..."` and matching field names
(`name`, `email`, `phone`, `message`) — `script.js` wires it up the same way.
