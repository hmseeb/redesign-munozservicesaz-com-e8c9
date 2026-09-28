# Muñoz Services LLC — Website

A complete redesign of the Muñoz Services LLC site: a locally owned air duct cleaning
company serving Arizona.

Built as a static site with **vanilla HTML, CSS and JavaScript** — no build step, no
dependencies and no server-side code. Contact form submissions are posted directly to
the LeadrVision forms endpoint.

## Files

| File           | Purpose                                                        |
| -------------- | -------------------------------------------------------------- |
| `index.html`   | Entry point — the full single-page site                         |
| `styles.css`   | All styling, design tokens and responsive rules                 |
| `script.js`    | Navigation, scroll reveals, gallery lightbox, form validation   |
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

## Contact form → LeadrVision

The contact form validates client-side and then POSTs to the LeadrVision forms endpoint:

```
https://vision.leadrai.com/api/forms/323616ccff3c9180b5b14e31c0418b42
```

The same URL is set as the form's `action`, so the form still works with JavaScript
disabled. Alongside the visible `name`, `email`, `phone` and `message` fields it sends:

- `_form` — a short human name for the form (`Contact`)
- `_page` — `window.location.href`, filled in on page load
- `_gotcha` — a hidden honeypot that real visitors never fill in

With JavaScript the response is `{"ok": true}` and the thank-you message is shown inline
while the form resets. Without JavaScript the visitor returns to the page with
`?submitted=1`, which shows the same confirmation.

To add another form later, give it `class="form"`, the same `action`, the three hidden
fields and matching field names (`name`, `email`, `phone`, `message`) — `script.js` wires
it up the same way.
