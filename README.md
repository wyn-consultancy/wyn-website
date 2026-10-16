# WYN Consultancy website

Plain HTML/CSS rebuild of wyn-consultancy.com, moved off Squarespace. No frameworks and no build step. Every file in `site/` is exactly what gets published.

## Structure

```
site/
  index.html                     Home
  services/index.html            Services and pricing overview (with full FAQ)
  services/advise|train|build/   One page per service
  about/index.html               About (first person)
  insights/index.html            Article listing
  insights/<slug>/index.html     One folder per article
  contact/index.html             Booking + contact form
  solutions/, news/              Redirects from the old Squarespace URLs (don't delete)
  _redirects                     Same redirects, for Cloudflare Pages / Netlify
  404.html, sitemap.xml, robots.txt
  llms.txt                       Plain-text summary of WYN for AI assistants
  assets/css/style.css           All styling. Colours and fonts at the top.
  assets/js/main.js              Settings (booking link, form endpoints) at the top
  assets/img/                    Logo, headshot, team photos, article images
```

Every page has structured data (JSON-LD) in its `<head>` describing WYN, Jules, the services and prices, FAQs and articles. **If you change a price or FAQ on a page, update it in that page's JSON-LD and in `llms.txt` too.**

## Settings to fill in at setup

In `site/assets/js/main.js`:
- `calLink`: your Cal.com booking URL. Once set, the contact page shows the calendar and every "Book a call" button opens it.
- `contactEndpoint` / `newsletterEndpoint`: form service URLs. Until set, both forms open a pre-filled email.

## Previewing locally

```bash
cd site && python3 -m http.server 8080
```

Then open http://localhost:8080. Pages use root paths (`/assets/...`), so double-clicking the HTML files in Finder won't load the styles. Use the server.

## Common edits

- **Change copy:** edit the text in the page's `index.html`.
- **Change colours or fonts:** edit the variables at the top of `assets/css/style.css`.
- **Header and footer:** these are repeated on every page. Ask Claude to update them across all pages at once.
- **Add an article:** copy an existing folder in `site/insights/`, rename it to the new slug, and replace the title, description, body and the JSON-LD dates. Add the cover image to `assets/img/news/`, add a card to `insights/index.html` (newest first, and to the home page's "Latest insights"), and add the URL to `sitemap.xml` and `llms.txt`.

## Publishing

The site is hosted on **GitHub Pages**. Every push to `main` publishes the `site/` folder automatically (see `.github/workflows/pages.yml`). Only `site/`, this README and the workflow are in the repository: `strategy/` and local tooling are excluded by `.gitignore`.

To publish a change:

```bash
git add -A && git commit -m "Describe the change" && git push
```

The update is live about a minute later. Progress is under the repository's **Actions** tab.

## Domain and DNS

- **Registrar:** Squarespace Domains. Paid until 8 February 2027. Cancelling the Squarespace *website* plan does not cancel the domain.
- **DNS records for GitHub Pages** (set in Squarespace → Domains → DNS):
  - `@` A records: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
  - `@` AAAA records: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
  - `www` CNAME: `<github-username>.github.io`
  - **Keep** the `google-site-verification` TXT record: it verifies Google Search Console.
- **Later (optional):** transfer the domain to Cloudflare Registrar before February 2027. It charges domains at cost.
