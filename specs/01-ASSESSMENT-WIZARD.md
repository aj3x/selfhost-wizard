# Phase 1 — Assessment Wizard

## Overview

The assessment wizard is a multi-screen guided form that collects information about the user's current situation, habits, and goals. Answers feed the cost model (see `02-COST-MODEL.md`) to produce a personalized recommendation.

The wizard adapts its depth, language, and recommendations based on the user's self-reported technical skill level, which is captured in Screen 1.

---

## Screen Flow

```
Screen 1: About You
    ↓
Screen 2: Current Subscriptions & Spending
    ↓
Screen 3: Media Habits
    ↓
Screen 4: Photos & Video
    ↓
Screen 5: Files & Backup
    ↓
Screen 6: Network & Access
    ↓
Screen 7: Security & Reliability
    ↓
Screen 8: Time & Maintenance
    ↓
Screen 9: Results & Recommendation
```

Each screen can conditionally show or hide questions based on prior answers. The user can go back and change answers at any point, and the results page updates in real-time.

---

## Screen 1: About You

**Purpose:** Set the tone for the entire experience. Determines how much we explain, how many options we present, and how opinionated our recommendations are.

### Q1.1 — How would you describe your technical skill level?

- **Beginner** — "I can install apps and follow instructions but I've never used a command line"
- **Intermediate** — "I'm comfortable with basic terminal commands and have maybe run a Docker container before"
- **Advanced** — "I manage my own servers, write scripts, and understand networking"

> **Impact:** This is the single most important question. It gates:
> - How much jargon we use in explanations
> - Whether we show "why" tooltips on recommendations
> - How many choices we present (beginners get curated picks, advanced get full menus)
> - Whether we recommend pre-built NAS solutions vs DIY
> - The complexity of the generated docker-compose
> - Whether we recommend Plex (easier) vs Jellyfin (free, more control)

### Q1.2 — How many people will use this server?

- Just me
- 2-3 people (partner/roommates)
- 4-6 people (family)
- 7+ people (extended family/friends)

> **Impact:** Affects concurrent stream estimates, user account needs, storage multipliers for personal file spaces, and hardware requirements.

### Q1.3 — Where do you live? (for electricity cost)

**Input:** Country + state/province selector, OR manual entry of electricity cost per kWh.

Provide a lookup table of average residential electricity rates by region. User can override with their actual rate from their utility bill.

**Default values to ship with (USD/kWh, updated periodically):**

| Region | Avg $/kWh |
|--------|-----------|
| US Average | 0.16 |
| US - California | 0.27 |
| US - Texas | 0.13 |
| US - New York | 0.22 |
| Canada Average | 0.13 CAD |
| Canada - Ontario | 0.13 CAD |
| Canada - Quebec | 0.07 CAD |
| Canada - BC | 0.1172 CAD |
| UK Average | 0.28 GBP |
| Germany | 0.30 EUR |
| Australia | 0.30 AUD |
| (More regions) | ... |

> **Impact:** Directly feeds monthly electricity cost calculation. Also determines currency for all cost displays.

### Q1.4 — What are your internet speeds?

- **Download speed** (Mbps) — number input with common presets: 50, 100, 300, 500, 1000, 2500
- **Upload speed** (Mbps) — number input with common presets: 10, 20, 50, 100, 500, 1000, 2500

Show a "test your speed" link to speedtest.net or fast.com.

> **Impact:** Upload speed is critical for remote access feasibility. Below ~20 Mbps upload, we should flag that remote streaming will be limited and cloud hosting might be preferable for remote access. Download speed affects how quickly media can be acquired.

---

## Screen 2: Current Subscriptions & Spending

**Purpose:** Establish the user's current monthly cost baseline for services that self-hosting could replace.

### Q2.1 — Streaming Video Services

Checklist with monthly costs (pre-filled with current standard pricing, user can edit):

| Service | Default Monthly Cost |
|---------|---------------------|
| Netflix (Standard) | $15.49 |
| Netflix (Premium/4K) | $22.99 |
| Hulu (No Ads) | $17.99 |
| Disney+ | $13.99 |
| HBO Max | $15.99 |
| Amazon Prime Video | $8.99 |
| Apple TV+ | $9.99 |
| Peacock Premium | $7.99 |
| Paramount+ | $11.99 |
| YouTube Premium | $13.99 |
| Crunchyroll | $7.99 |
| Other (custom entry) | — |

User checks which they have and adjusts costs. Multiple "Other" entries allowed.

> **Note for results:** We should be clear that self-hosting doesn't directly replace these — you need media to serve. The cost comparison is "what you're paying for content access" vs "what you'd pay for infrastructure + content acquisition." Content acquisition cost is addressed in Screen 3.

### Q2.2 — Music Services

| Service | Default Monthly Cost |
|---------|---------------------|
| Spotify (Individual) | $11.99 |
| Spotify (Family) | $19.99 |
| Apple Music (Individual) | $10.99 |
| Apple Music (Family) | $16.99 |
| YouTube Music | $13.99 |
| Tidal (HiFi) | $10.99 |
| Amazon Music Unlimited | $9.99 |
| Other | — |

> **Impact:** If they select music services, we'll recommend Lidarr + Navidrome/Jellyfin for music. Storage impact is relatively small (a large music library is ~500GB–1TB in FLAC).

### Q2.3 — Cloud Storage Services

| Service | Tier | Default Monthly Cost |
|---------|------|---------------------|
| Google One | 100 GB | $1.99 |
| Google One | 200 GB | $2.99 |
| Google One | 2 TB | $9.99 |
| iCloud+ | 50 GB | $0.99 |
| iCloud+ | 200 GB | $2.99 |
| iCloud+ | 2 TB | $9.99 |
| Dropbox Plus | 2 TB | $11.99 |
| OneDrive | 1 TB | $6.99 |
| Other | — | — |

**Follow-up:** How much of your cloud storage are you actually using? (slider or input, in GB)

> **Impact:** Feeds storage calculation and helps determine if file sync (Nextcloud/Syncthing) should be recommended.

### Q2.4 — Photo Backup Services

| Service | Default Monthly Cost |
|---------|---------------------|
| Google Photos (included in Google One above) | $0 (already counted) |
| iCloud Photos (included in iCloud above) | $0 (already counted) |
| Amazon Photos (with Prime) | $0 (note: unlimited with Prime) |
| Flickr Pro | $7.49 |
| Other | — |

> **Note:** If they already counted Google One or iCloud above, don't double-count. The UI should reflect this.

### Q2.5 — VPN Services

| Service | Default Monthly Cost |
|---------|---------------------|
| Mullvad | $5.46 (5 EUR) |
| NordVPN | ~$4.59 (varies by plan) |
| SurfShark | ~$2.49 (varies by plan) |
| ProtonVPN | ~$4.99 |
| ExpressVPN | ~$8.32 |
| IPVanish | ~$3.33 |
| Other | — |
| None | $0 |

> **Impact:** If they already have a VPN, that cost isn't new. If they don't, we need to factor one in for the download client routing. Also feeds Phase 2 VPN provider selection.

### Q2.6 — Other Self-Hostable Services

Checklist (no cost — just to identify what they use that has self-hosted alternatives):

- Password manager (1Password, Bitwarden, LastPass, Dashlane)
- Note-taking (Notion, Evernote, Obsidian Sync)
- Bookmarks manager
- Recipe manager
- Read-later / bookmarking (Pocket, Instapaper)
- Home automation (SmartThings, etc.)
- Other (text input)

> **Impact:** These don't usually have significant costs but expand the service recommendations in Phase 2. Also helps demonstrate breadth of what self-hosting can replace.

### Calculated Output from Screen 2

**Total Current Monthly Spending: $X/month ($Y/year)**

Display a running total as they check items. This number is the "what you're paying now" baseline.

---

## Screen 3: Media Habits

**Purpose:** Determine media volume, quality preferences, and acquisition approach to estimate storage needs and recommend the right tools.

### Q3.1 — How do you plan to get your media?

- **I'll buy and rip physical media** (Blu-ray/DVD)
- **I'll buy digital copies** (iTunes, Vudu, etc.)
- **I have an existing digital library already** — How large? (GB input)
- **I'd rather not say / a mix of methods**

> **Design note:** We don't need to know specifics. This question exists to estimate whether they'll have ongoing content costs (buying) vs infrastructure-only costs. For "rather not say," assume infrastructure-only and note that content acquisition costs aren't included in the estimate.

### Q3.2 — What video quality do you care about?

- **1080p is fine** (~4-8 GB per movie, ~1-3 GB per TV episode)
- **4K when available** (~20-60 GB per movie, ~5-15 GB per TV episode)
- **4K with HDR/Dolby Vision preferred** (~40-80 GB per movie)
- **I don't know** → default to 1080p for estimates, note 4K upgrade path

> **Impact:** Massive storage multiplier. A 500-movie library at 1080p is ~2-3 TB. At 4K remux it's 20-30 TB. This is the single biggest driver of storage requirements.

### Q3.3 — How large do you expect your library to grow?

Sliders or input fields:

- **Movies:** (range: 0 to 2000+, default 100)
- **TV Shows (seasons):** (range: 0 to 500+, default 20)

Show estimated storage as they adjust, using the quality from Q3.2.

> **Beginner mode:** Instead of raw numbers, ask: "How would you describe your collection goal?"
> - "Just the favorites — maybe 50-100 movies and a few shows"
> - "A solid library — a few hundred movies, lots of shows"
> - "Everything — I want a comprehensive collection"
> - "I'm not sure yet, start small"

### Q3.4 — How many people will stream at the same time?

- 1 (just me)
- 2-3 (couple/roommates)
- 4-5 (family)
- 6+ (hosting for extended family/friends)

> **Impact:** Determines transcoding requirements. 1-2 concurrent 1080p direct-play streams need almost no CPU. 4+ concurrent transcodes need serious hardware or a GPU.

### Q3.5 — Will your streaming devices direct-play most content?

Explain in a tooltip: "Direct-play means your TV/device can play the file as-is without the server converting it. Most modern smart TVs, Apple TV 4K, and Nvidia Shield can direct-play almost everything. Older devices, Chromecast, and browser playback often need transcoding."

- **Yes / Mostly** — modern smart TV, Apple TV 4K, Shield, etc.
- **No / Mixed** — some devices will need transcoding (older TVs, Chromecast, phones)
- **I'm not sure** — assume some transcoding needed

> **Impact:** If transcoding is likely, we factor in either a CPU powerful enough or recommend GPU transcoding (which affects hardware recs). Also triggers Tdarr recommendation for pre-transcoding libraries.

### Q3.6 — Do you want automated media management?

Explain: "Tools like Sonarr and Radarr can automatically find, download, and organize your media. They monitor for new releases of shows you follow and maintain your library quality."

- **Yes, fully automated** → Sonarr, Radarr, Prowlarr, download client
- **Semi-automated** — I want to manually approve things → Same tools but with different config
- **No, I'll manage files manually** → Skip *arr stack

> **Beginner note:** For beginners, default to "yes" with explanation of what this means. This is one of the primary values of self-hosting.

### Q3.7 — Are you interested in self-hosted music?

- **Yes, replacing a streaming service** → Lidarr + Navidrome or Jellyfin music
- **Yes, just organizing my existing library** → Navidrome or Jellyfin music only
- **No**

If yes:
- Estimated library size: (GB input, or "small/medium/large" for beginners: small = <50GB, medium = 50-500GB, large = 500GB+)
- Do you want lossless/FLAC? (affects storage estimate by ~3-5x vs MP3)

---

## Screen 4: Photos & Video Backup

**Purpose:** Size the photo/video backup workload, which can rival or exceed media storage for families with lots of devices.

### Q4.1 — Do you want to self-host photo backup?

- **Yes, replacing Google Photos / iCloud Photos**
- **Yes, as an additional backup**
- **No** → Skip rest of screen

### Q4.2 — How many devices will back up photos?

For each device (allow adding/removing):

- Device type: Phone / Tablet / Camera (DSLR/Mirrorless) / Action Camera / Drone
- Approximate number of photos already on device: (input or small/medium/large: small = <5K, medium = 5-50K, large = 50K+)
- Do you shoot a lot of video? Yes / Some / Rarely

> **Storage estimation guidance:**
> - Average phone photo (HEIF/JPEG): ~3-5 MB
> - Phone 4K video: ~350 MB/min
> - DSLR RAW photo: ~25-50 MB
> - Mirrorless RAW: ~25-80 MB (depending on sensor)
> - 4K video from camera: ~500-750 MB/min

### Q4.3 — How large is your existing photo library?

- Number input (GB) if they know
- Or estimate: "How many years of photos?" × "How many photographers in the household?"

> **Rule of thumb for estimation:**
> - Casual phone photographer: ~20-50 GB/year
> - Active phone photographer: ~50-150 GB/year
> - Family with kids (lots of photos + videos): ~100-400 GB/year
> - Enthusiast with DSLR/mirrorless: ~200-500 GB/year
> - Prolific shooter/videographer: ~500 GB-2 TB/year

### Q4.4 — Do you want ML features?

Explain: "Features like face recognition, smart search ('photos of dogs at the beach'), and automatic albums. These require more processing power."

- **Yes** → Recommend Immich, note GPU benefits
- **Basic organization is fine** → Immich still works but lower hardware requirement
- **I just want backup, not management** → Could use Syncthing/Nextcloud instead

---

## Screen 5: Files & Backup

**Purpose:** Determine file sync and backup needs beyond media and photos.

### Q5.1 — Do you want to back up or sync files from your computers?

- **Yes, replace cloud storage** (Dropbox/OneDrive/Google Drive replacement)
- **Yes, as an additional backup**
- **No** → Skip to Q5.4

### Q5.2 — How many computers need backup?

- Number input (1-10)
- For each: approximate data to back up (GB)

### Q5.3 — What kind of backup do you need?

Explain in beginner-friendly terms:

- **File sync** — "Like Dropbox. Files are available on all devices and stay in sync." → Nextcloud or Syncthing
- **Versioned backup** — "Keeps old versions of your files so you can go back in time. Good for protecting against accidental deletion or ransomware." → Duplicati, Restic, or Kopia
- **Both** — recommended for important data

### Q5.4 — Do you plan to work directly off this server?

Explain: "For example, editing video files stored on the server, running a development environment, or using it as a network drive you work from daily."

- **Yes, heavily** (video editing, development) — needs fast storage, 10GbE consideration
- **Yes, occasionally** (documents, light use) — standard NAS performance fine
- **No, it's just for storage/backup**

> **Impact:** Working off the server demands lower-latency storage (SSD cache or NVMe), possibly 10 Gigabit networking, and affects whether we recommend a NAS with SSD cache or a higher-performance build.

### Q5.5 — Do multiple household members need personal file spaces?

- Yes → Nextcloud with per-user storage, factor in per-person storage allocation
- No → Simpler shared folder or single-user setup

---

## Screen 6: Network & Access

**Purpose:** Determine how and where the server will be accessed, which drives the networking/security stack.

### Q6.1 — Will you access this server from outside your home?

- **No, local network only** → Simplest setup, no reverse proxy or VPN needed
- **Yes, occasionally** (check on things, grab a file) → Tailscale recommended
- **Yes, regularly** (stream media while traveling, work remotely) → Tailscale or reverse proxy
- **Yes, and I want to share with people outside my household** → Reverse proxy + auth likely needed

> **Beginner default:** Tailscale for any remote access. It's simple, doesn't expose ports, and just works. For advanced users, present the full menu: Tailscale, WireGuard, Cloudflare Tunnel, reverse proxy with Authelia/Authentik.

### Q6.2 — Do you already have a VPN service? (pre-filled from Q2.5)

If no: "You'll need a VPN for routing download traffic. We recommend Mullvad for its simplicity and privacy. Budget ~$5/month."

### Q6.3 — Are you comfortable opening ports on your router?

- **Yes** → Full reverse proxy option available
- **No / I don't know** → Recommend Tailscale or Cloudflare Tunnel (no port forwarding needed)

> **Beginner note:** Explain what port forwarding is and why it matters. Link to router-specific guides.

### Q6.4 — Do you want a custom domain name?

- **Yes, I already have one**
- **Yes, I'd like to set one up** → Note ~$10-15/year cost for domain
- **No** → Access via IP or Tailscale magic DNS

> **Impact:** Custom domain enables nicer URLs (plex.mydomain.com) and easier SSL. Works best with reverse proxy or Cloudflare Tunnel.

### Q6.5 — Do you want ad blocking for your network?

- **Yes** → Pi-hole or AdGuard Home
- **No / I already use browser extensions**

---

## Screen 7: Security & Reliability

**Purpose:** Determine how important data protection is, which drives RAID, backup, and security recommendations.

### Q7.1 — How critical is your data?

Frame as scenarios:

- **Replaceable** — "Most of my media can be re-downloaded. I'd be annoyed but not devastated if I lost data." → Single drive or RAID 0/JBOD acceptable, no off-site needed
- **Important** — "I have family photos and personal documents I can't replace, but my media library could be rebuilt." → RAID 1/5 for important data, off-site backup for irreplaceable files
- **Critical** — "Losing this data would be devastating. Photos spanning decades, critical documents, irreplaceable archives." → RAID + off-site backup + 3-2-1 backup strategy
- **Mission-critical** — "This is also my work. Downtime costs me money." → Redundant everything, UPS, monitoring, off-site, tested recovery plan

> **Beginner note:** Explain that RAID is not backup. A RAID array protects against a single drive dying, but not against ransomware, accidental deletion, fire, theft, or controller failure.

### Q7.2 — Risk tolerance for data exposure

Explain: "Self-hosting means your data lives on hardware you control. This is more private than cloud services, but also means you're responsible for security."

- **Minimal exposure** — "I don't want anything accessible from the internet." → Local only + Tailscale for remote access
- **Cautious** — "I'll expose what I need to but with strong authentication." → Reverse proxy + SSO + fail2ban
- **Standard** — "I trust standard security practices." → Reverse proxy + auth
- **Advanced** — "I'll handle security myself." → Full control, no guardrails

> **Impact:** Determines whether we configure Authelia/Authentik, whether services bind to localhost vs 0.0.0.0, firewall recommendations, and how strongly we push Tailscale.

### Q7.3 — Do you want off-site backup?

Explain: "Protects against physical disasters — fire, flood, theft. Your data exists in a second location."

- **Yes, to a cloud provider** (Backblaze B2, Wasabi, etc.) → Factor in ~$5/TB/month cost
- **Yes, to another location I control** (friend/family member's house, second property) → Recommend Syncthing or rsync over Tailscale
- **No** → Flag this as a risk in the results if they have critical data

### Q7.4 — Do you want a UPS (battery backup)?

Explain: "A UPS keeps your server running during brief power outages and gives it time to shut down safely during longer ones. Prevents data corruption from sudden power loss."

- **Yes** → Add ~$80-200 to hardware cost
- **No** → Flag as risk for RAID arrays and databases

---

## Screen 8: Time & Maintenance

**Purpose:** Set realistic expectations about ongoing time investment and factor it into the recommendation.

### Q8.1 — How much time can you spend on initial setup?

- **A few hours** — "I want it working this weekend." → Pre-built NAS or highly opinionated setup
- **A weekend** — "I can dedicate a full weekend to this." → DIY build with guided setup
- **I'll take my time** — "I'm happy to learn as I go over a few weeks." → Full DIY, more customization
- **Time is not a constraint** — advanced user who enjoys tinkering

> **Impact:** Beginner + "a few hours" → strongly recommend Synology/Ugreen. Intermediate + "a weekend" → DIY with guided setup. Advanced + any → full configurator.

### Q8.2 — How much ongoing maintenance time are you willing to invest?

- **Minimal** — "I want it to run itself. Maybe check on it monthly."
- **Some** — "I'm okay spending an hour a week managing things."
- **Regular** — "I enjoy tinkering and don't mind regular maintenance."

> **Impact:** Affects whether we recommend Watchtower (auto-updates) vs manual updates, monitoring complexity, and how many services we suggest. More services = more maintenance.

### Q8.3 — What's your comfort with things breaking?

- **Low** — "If something breaks I'll panic." → Conservative recommendations, fewer services, proven stable configs
- **Medium** — "I can troubleshoot with help from guides and forums."
- **High** — "I expect things to break sometimes. I'll figure it out."

> **Impact:** Affects how cutting-edge our recommendations are. Low tolerance → stable, well-documented services only. High tolerance → can include newer options.

### Q8.4 — Do you have someone who can help?

- **Yes, a tech-savvy friend/family member**
- **No, I'm on my own** — Note: communities like r/selfhosted and various Discord servers are excellent resources
- **I plan to use AI tools to help me** — Valid and increasingly viable

---

## Screen 9: Results & Recommendation

### Summary Dashboard

**Monthly Cost Comparison**

```
Current SaaS spending:           $XX.XX/month
Self-hosted equivalent:          $XX.XX/month (electricity + off-site backup + VPN + domain)
Monthly savings:                 $XX.XX/month
```

**Upfront Cost Estimate**

```
Hardware (server/NAS):           $XXX - $XXX
Storage (drives):                $XXX - $XXX
Accessories (UPS, cables, etc.): $XXX - $XXX
Total upfront:                   $XXX - $XXX
```

**Break-Even Timeline**

```
At current savings rate:         X months to break even
Including drive replacement:     X months to break even (adjusted)
```

**Risk-Adjusted Analysis**

```
Drive failure cost (annualized): $XX/year  (see 02-COST-MODEL.md for formula)
Data loss risk:                  Low/Medium/High (based on RAID + backup answers)
Security exposure:               Low/Medium/High (based on access + auth answers)
Time investment:                 X hours setup + X hours/month ongoing
```

### Recommendation Tier

Based on all answers, the user gets ONE of these recommendations:

**"Stick with what you have"**
Conditions: Low spending (<$20/month), minimal storage needs, beginner skill + low time availability. Self-hosting isn't worth it for them right now.

**"Consider a managed NAS"**
Conditions: Moderate needs, beginner to intermediate skill, low maintenance tolerance. Recommend Synology or Ugreen with key apps.

**"DIY is worth it for you"**
Conditions: Significant savings potential, adequate skill level, reasonable time budget. Proceed to Phase 2 configurator.

**"Go cloud-hosted"**
Conditions: High remote access needs, slow upload speed, low time tolerance, but significant SaaS spending. Recommend a Hetzner/OVH dedicated server with Docker.

**"You're ready for a full stack"**
Conditions: Advanced user, high needs, time available. Full configurator with all options unlocked.

### Shareable Output

Generate a shareable summary card (image or link) showing the cost comparison. Good for social media sharing and driving traffic.

### Call to Action

"Ready to build? → Start the Configurator" (Phase 2)
"Want to learn more first?" → Link to recommended reading/communities
"Not convinced?" → Show what a minimal setup looks like (just Jellyfin + Immich, for example)

---

## Conditional Logic Map

This table shows which questions appear based on prior answers.

| Question | Shown When |
|----------|-----------|
| Q3.x (Media) | Always shown (core use case) |
| Q3.5 (Transcoding) | Q3.4 > 1 concurrent stream OR Q3.2 = 4K |
| Q3.6 (Automated management) | Q3.1 ≠ "buy digital copies only" |
| Q3.7 (Music) | Q2.2 has any selection OR always show |
| Q4.x (Photos) | Q4.1 = Yes |
| Q4.4 (ML features) | Q4.1 = Yes |
| Q5.2-5.3 (Backup details) | Q5.1 = Yes |
| Q5.4 (Work off server) | Q5.1 = Yes |
| Q6.2 (VPN) | Q3.6 = automated or semi-automated |
| Q6.3 (Port forwarding) | Q6.1 = regular or share outside household |
| Q6.4 (Domain) | Q6.1 ≠ local only |
| Q6.5 (Ad blocking) | Always shown |
| Q7.3 (Off-site backup) | Q7.1 = Important, Critical, or Mission-critical |
| Q7.4 (UPS) | Always shown |
| Q8.x (Time) | Always shown |

---

## Data Collected (Summary)

After the wizard, we have the following data points to feed into calculations:

**User profile:** skill_level, household_size, location/electricity_rate, internet_speeds (up/down)

**Current spending:** streaming_services[], music_services[], cloud_storage[], photo_backup[], vpn_service, other_services[]

**Media needs:** acquisition_method, video_quality, library_size (movies/shows), concurrent_streams, needs_transcoding, wants_automation, wants_music, music_library_size

**Photo/video needs:** wants_photo_backup, devices[], existing_library_size, wants_ml_features

**File needs:** wants_file_sync, computers_count, backup_data_size, backup_type, works_off_server, needs_personal_spaces

**Network:** remote_access_level, has_vpn, comfortable_with_ports, wants_domain, wants_adblocking

**Security:** data_criticality, risk_tolerance, wants_offsite_backup, offsite_type, wants_ups

**Time:** setup_time_budget, maintenance_time_budget, break_tolerance, has_help
