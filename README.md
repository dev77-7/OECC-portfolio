# OECC website

Static site for Om Engineering Construction Company (OECC). Plain HTML, CSS and JavaScript: no build step, no framework, no third-party scripts. Every file is served as-is by any web server.

```
index.html            the page (5 sections: hero, sustainability, legacy, projects, contact)
style.css             all styles
script.js             charts, map/list linking, enquiry-form dialog, nav (no dependencies)
404.html              not-found page
favicon.ico  robots.txt  sitemap.xml  site.webmanifest
assets/fonts/         Archivo variable font (self-hosted, SIL Open Font License)
assets/img/           hero photo (WebP + JPEG, 900 and 1600 px), logo and icon sizes, social preview image
assets/video/         sunrise cooling-tower clip (MP4 + WebM, 145 KB together, converted from the 2.6 MB GIF) and its poster
deploy/               EC2 setup, deploy script and nginx config (never uploaded to the web root)
```

## 1. Before launch: fill these in

Unfinished text is wrapped in `<span class="fill-in">[...]</span>` and shows with an orange underline. Replace each whole span with plain text. The browser console lists any that remain, and `deploy/deploy.sh` refuses to publish while any are left.

| Where (index.html) | What to add |
|---|---|
| Hero title block, `Established` and `data-founded="1986"` on the dimension | Confirm the founding year. 1986 was worked out from "40 years". |
| Legacy, `data-handover=""` | Year the second generation took over. The dimension line splits at this year. |
| Legacy, first generation | Founder's name, first works, a short quote from the founder |
| Legacy, second generation | Current leadership names, 3 real milestones |
| Projects, each site card, "OECC's work" | Scope and years at that site (e.g. "Civil works, units 7 and 8, 2011 to 2018") |
| Contact | Phone number and registered office address |
| Contact, `href="https://docs.google.com/forms/d/e/YOUR_FORM_ID/viewform"` | Your Google Form link (Google Forms: **Send** > link icon > copy). Until it is set, the button falls back to email. |
| `<head>` canonical, `og:url`, `og:image`, JSON-LD, plus `robots.txt` and `sitemap.xml` | Your real domain, if it is not `www.oecc.co.in` |

### Images to replace

- **Hero photo.** The brief asks for an HD photo of a construction manager looking at a nuclear plant. The only plant image supplied is a 626 px Freepik preview, so the hero currently pairs it with a drawn silhouette of a manager in a hard hat. For launch, use a real photo at least 2400 px wide (ideally your own site manager at an NPCIL site, if photography is permitted, or a licensed stock photo). Save it as `assets/img/hero-2400.webp` / `.jpg`, point the `<picture>` sources in the hero at it, and delete the `<svg class="hero-figure">` block.
- **Licences.** The Freepik image needs the "Freepik" credit that is in the footer (free licence) or a premium licence. Check the source and licence of the sunrise cooling-tower clip (`nuclear-plant-sr.gif`, used in the sustainability section) before publishing.
- **Not used:** `nuclear-plant-90s.gif` shows an oil refinery with smokestacks, which undercuts the clean-energy message. `nuclear-plant-slow.gif` (aerial towers) is 420 px wide, too small for a full-width slot; drop it in later if you find a use for it.
- The plant photo and clip show foreign stations, not NPCIL sites. Your own site photos, where photography is permitted, would be more convincing to NPCIL readers.

## 2. Preview locally

```bash
cd oecc-site
python3 -m http.server 8080
# open http://localhost:8080
```

Using a local server (rather than double-clicking `index.html`) matches how the live site behaves, including the 404 page.

## 3. Hosting: what "free" means on AWS today

Checked October 2026 against AWS's own pricing pages.

| Option | Cost after the free period | Notes |
|---|---|---|
| **EC2 (this kit)** | Instance hours plus **$3.65/month for the public IPv4 address** | New AWS accounts (opened on or after 15 July 2025) get $100 in credits, plus up to $100 more for trying services, on a Free plan that ends after **6 months** or when the credits run out. Older accounts' 12-month free tier has ended. An EC2 server will start billing at that point. |
| **S3 + CloudFront, flat-rate Free plan** | **$0/month** | 1M requests and 100 GB a month, 5 GB of S3 storage, free TLS certificate, custom domain, and Route 53 DNS for that domain included. Requires an account on the Paid plan (you are only billed for usage beyond free allowances). Far more than this site needs. |
| Cloudflare Pages / GitHub Pages | $0 | Also fine for a static site. GitHub's terms discourage using Pages for a business's main site. |

The site is the same files in every case, so you can start on EC2 and move later without changing anything.

**Domain and DNS.** The old site used `info@oecc.co.in`, so you likely own `oecc.co.in`. Route 53 cannot register `.co.in`, but you can keep the domain where it is and add an `A` record (EC2) or `CNAME`/`ALIAS` (CloudFront) at your current registrar. That avoids Route 53's $0.50/month hosted-zone fee. "Amazon DNS" in the sense of the instance's `ec2-…amazonaws.com` name works for testing, but it is HTTP only: Let's Encrypt will not issue certificates for `amazonaws.com` names, so the live site needs your own domain.

## 4. Deploy to EC2

1. **Launch the instance.** EC2 console > Launch instance. Region: Asia Pacific (Mumbai) `ap-south-1`. AMI: Ubuntu Server 24.04 LTS. Type: a free-tier eligible size (`t3.micro`). Create a key pair and download the `.pem`. Security group: allow SSH (22) from **your IP only**, HTTP (80) and HTTPS (443) from anywhere.
2. **Give it a fixed address.** EC2 > Elastic IPs > Allocate > Associate with the instance. Without this the IP changes every time the instance stops.
3. **Point your domain** (skip to test on the EC2 name first): at your registrar, set `A` records for `oecc.co.in` and `www.oecc.co.in` to the Elastic IP.
4. **Copy the site and run setup**, from your computer:
   ```bash
   chmod 400 ~/Downloads/oecc-key.pem
   rsync -avz -e "ssh -i ~/Downloads/oecc-key.pem" ./ ubuntu@<ELASTIC-IP>:~/oecc-site/
   ssh -i ~/Downloads/oecc-key.pem ubuntu@<ELASTIC-IP>
   # on the server:
   sudo bash ~/oecc-site/deploy/setup-ec2.sh oecc.co.in you@oecc.co.in   # with domain + HTTPS
   # or: sudo bash ~/oecc-site/deploy/setup-ec2.sh                       # no domain yet, HTTP on the EC2 name
   ```
   The script installs nginx, copies the site to `/var/www/oecc`, installs the config with gzip, caching and security headers, and, with a domain, gets a Let's Encrypt certificate that renews itself.
5. **Later updates**, from your computer: `./deploy/deploy.sh ubuntu@<ELASTIC-IP> ~/Downloads/oecc-key.pem`
6. **Set a billing alarm.** Billing > Budgets > create a $1 monthly cost budget with an email alert, so the end of the free period never comes as a surprise.

## 5. Alternative: S3 + CloudFront (stays free)

1. Create a private S3 bucket (Block all public access on) in `ap-south-1`.
2. CloudFront > Create distribution > origin: the bucket, with **Origin access control**. Default root object: `index.html`. Custom error response: 404 → `/404.html`. Choose the **Free** flat-rate plan. Add your domain and request the free ACM certificate when prompted. Attach a response headers policy with the headers from `deploy/nginx/oecc-headers.conf`.
3. Upload with the AWS CLI from the site folder:
   ```bash
   B=your-bucket-name
   aws s3 sync . s3://$B --delete --exclude "deploy/*" --exclude "README.md" --exclude ".git*" \
     --exclude "*.html" --exclude "*.css" --exclude "*.js" --cache-control "public,max-age=2592000"
   aws s3 sync . s3://$B --exclude "*" --include "*.html" --include "*.css" --include "*.js" \
     --include "*.webmanifest" --include "*.txt" --include "*.xml" --cache-control "no-cache"
   ```
4. Point your domain at the distribution (CNAME for `www`; ALIAS/ANAME for the apex if your registrar supports it, or use the hosted zone the plan includes).

## 6. Updating the charts

All chart data is at the top of `script.js` in `DATA`:

- `compare.carbon` / `compare.deaths`: the two bar charts, with their source lines.
- `reactors`: one row per Indian reactor `[year of commercial operation, name, MWe]`. When RAPP-8 (700 MWe) enters commercial operation, add `[2026 or 2027, 'RAPP-8', 700]`, raise `historyEnd` if needed, and update `targets[0].value`.
- `targets`: today's installed capacity and the national targets. Both exclude RAPS-1, matching NPCIL's current count.

## 7. Data sources

- Lifecycle emissions: IPCC AR5 WGIII (2014), Annex III, Table A.III.2, median values.
- Deaths per TWh: Our World in Data (Ritchie, 2020), from Markandya & Wilkinson (2007, *The Lancet*) and Sovacool et al. (2016, *Journal of Cleaner Production*).
- Avoided emissions and deaths: Kharecha & Hansen (2013), *Environmental Science & Technology* 47(9), 4889–4895, doi:10.1021/es3051197.
- Indian reactors, capacities and dates: NPCIL "All Plants" page (24 units, 8,780 MWe, excluding RAPS-1), PIB releases, World Nuclear News.
- Generation (56,681 MU in 2024–25), share (3.1%) and CO₂ avoided (about 49 Mt): PIB, DAE year-end review, 10 December 2025.
- Targets: 22.38 GW by 2031–32 excluding RAPS-1 (22,480 MW including it), PIB December 2025; at least 100 GW by 2047, Union Budget 2025–26 speech, paragraph 61.
- India map: Natural Earth 1:10m admin-0 countries, India point of view (`ne_10m_admin_0_countries_ind`), public domain, which follows India's official boundaries.
