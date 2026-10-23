# OECC website

Static site for Om Engineering Construction Company (OECC). Plain HTML, CSS and JavaScript: no build step, no framework, no third-party scripts. Every file is served as-is by any web server.

```
index.html            the page (5 sections: hero, sustainability, legacy, projects, contact)
style.css             all styles
script.js             charts, map/list linking, enquiry-form dialog, nav (no dependencies)
404.html              not-found page
favicon.ico  robots.txt  sitemap.xml  site.webmanifest
assets/fonts/         Archivo variable font (self-hosted, SIL Open Font License)
assets/img/           logo and icon sizes, social preview image
assets/video/         hero-aerial-*: the hero loop (1080p and 720p, MP4 + WebM) and its poster frame
                      towers-sunrise*: sunrise cooling-tower clip for the sustainability section, and its poster
deploy/               EC2 setup, deploy script and nginx config (never uploaded to the web root)
```

## 1. Content and what's still to come

All company details are filled in: founding year (1984), both generations, project scope per site, contact details, the `oeccpl.com` domain and the enquiry form. If any text is ever wrapped in `<span class="fill-in">[...]</span>`, it shows with an orange underline and `deploy/deploy.sh` refuses to publish until it's replaced.

**Leadership photos.** The "From the directors' desk" section shows the OECC mark in each frame until photos are added. Save each photo, cropped to portrait 4:5 (at least 800 × 1000 px, JPEG), with exactly these names, and the page picks them up with no code change:

| Person | File |
|---|---|
| Ram Niwas Sharma | `assets/img/team/ram-niwas-sharma.jpg` |
| Sri Niwas Sharma | `assets/img/team/sri-niwas-sharma.jpg` |
| Dheeraj Sharma | `assets/img/team/dheeraj-sharma.jpg` |
| Pankaj Sharma | `assets/img/team/pankaj-sharma.jpg` |
| Deepak Sharma | `assets/img/team/deepak-sharma.jpg` |

Until then the browser console shows a "failed to load" line per missing photo; visitors don't see anything.

**Timeline.** The legacy section's dimension drawing reads its years from `data-founded="1984"`, `data-handover="2014"` (second generation joins), `data-leadership="2022"` and `data-now="2026"`. Change a year there and the "42 years" label and bar positions follow.

**Enquiry form.** The button uses the short link `https://forms.gle/ohWZSvhMQYTB2mot7`, which opens the form in a new tab. To show the form inside the page instead, open the short link, copy the full `https://docs.google.com/forms/d/e/…/viewform` address from the browser bar and paste it into the button's `href`.

**Reactor statuses.** Each project card lists its units with a status (operating, fuel loading, under construction, refurbishment, shut down), from `DATA.siteStatus` in `script.js`, dated by `DATA.statusAsOf`. Update a line there when NPCIL reports a change, e.g. when RAPP-8 enters commercial operation.

### Hero video and other media

- **How the hero loop was made.** `nuclear-plant-slow.gif` (420 × 236 px, 10 fps, 5.3 MB) was upscaled 4× frame by frame with Real-ESRGAN (realesr-general-x4v3, medium denoise), motion-interpolated to 30 fps, and the last 1.5 s cross-dissolved into the start so it loops without a jump. It is served as a muted, autoplaying video rather than a GIF: it starts on first load exactly like a GIF but is a fraction of the size, and phones get a 720p version. For comparison, the best GIF of this loop was 14.5 MB at 960 px and 10 fps, against 3.8 MB for the 1080p video and 1.6 MB for 720p. The poster image is the loop's first frame, so the page looks the same before and after the video starts. It shows no controls. Visitors who have reduced motion turned on in their device settings see the still frame instead, and it pauses while scrolled out of view.
- **Replacing it with your own drone footage** (recommended: real NPCIL site footage, if filming is permitted). From a 1080p or 4K clip `in.mp4`, trimmed to 10 to 20 s:
  ```bash
  ffmpeg -i in.mp4 -an -vf "scale=1920:-2,fps=30" -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -movflags +faststart assets/video/hero-aerial-1080.mp4
  ffmpeg -i in.mp4 -an -vf "scale=1920:-2,fps=30" -c:v libvpx-vp9 -b:v 0 -crf 38 -row-mt 1 assets/video/hero-aerial-1080.webm
  ffmpeg -i in.mp4 -an -vf "scale=1280:-2,fps=30" -c:v libx264 -crf 27 -preset slow -pix_fmt yuv420p -movflags +faststart assets/video/hero-aerial-720.mp4
  ffmpeg -i in.mp4 -an -vf "scale=1280:-2,fps=30" -c:v libvpx-vp9 -b:v 0 -crf 39 -row-mt 1 assets/video/hero-aerial-720.webm
  ffmpeg -i in.mp4 -vf "scale=1600:-2" -frames:v 1 -q:v 70 assets/video/hero-aerial-poster.webp
  ```
  Because media files are cached for 30 days, give replacements new names (e.g. `hero-aerial-v2-1080.mp4`) and update the `<source>` lines.
- **Licences.** Check the source and licence of the two clips in use, `nuclear-plant-slow.gif` (hero) and `nuclear-plant-sr.gif` (sustainability section), before publishing. Upscaling doesn't change who owns the footage.
- **Not used:** `nuclear-plant-90s.gif` shows an oil refinery with smokestacks, which undercuts the clean-energy message. The Freepik plant photo is no longer used, so it needs no credit.
- Both clips show foreign stations, not NPCIL sites. Your own site photos, where photography is permitted, would be more convincing to NPCIL readers.

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

**Domain and DNS.** The site's domain is `oeccpl.com`. You can keep it with its current registrar and add an `A` record (EC2) or `CNAME`/`ALIAS` (CloudFront) at your current registrar. That avoids Route 53's $0.50/month hosted-zone fee. "Amazon DNS" in the sense of the instance's `ec2-…amazonaws.com` name works for testing, but it is HTTP only: Let's Encrypt will not issue certificates for `amazonaws.com` names, so the live site needs your own domain.

## 4. Deploy to EC2

1. **Launch the instance.** EC2 console > Launch instance. Region: Asia Pacific (Mumbai) `ap-south-1`. AMI: Ubuntu Server 24.04 LTS. Type: a free-tier eligible size (`t3.micro`). Create a key pair and download the `.pem`. Security group: allow SSH (22) from **your IP only**, HTTP (80) and HTTPS (443) from anywhere.
2. **Give it a fixed address.** EC2 > Elastic IPs > Allocate > Associate with the instance. Without this the IP changes every time the instance stops.
3. **Point your domain** (skip to test on the EC2 name first): at your registrar, set `A` records for `oeccpl.com` and `www.oeccpl.com` to the Elastic IP.
4. **Copy the site and run setup**, from your computer:
   ```bash
   chmod 400 ~/Downloads/oecc-key.pem
   rsync -avz -e "ssh -i ~/Downloads/oecc-key.pem" ./ ubuntu@<ELASTIC-IP>:~/oecc-site/
   ssh -i ~/Downloads/oecc-key.pem ubuntu@<ELASTIC-IP>
   # on the server:
   sudo bash ~/oecc-site/deploy/setup-ec2.sh oeccpl.com deepak@oeccpl.com   # with domain + HTTPS
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
