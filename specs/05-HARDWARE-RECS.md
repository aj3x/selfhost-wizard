# Hardware Recommendations

## Overview

Hardware recommendations are generated from assessment data. We present tiered options and let the user decide, with one tier highlighted as "recommended" based on their profile. We stay generic but explicitly call out pre-built NAS options and the "use what you have" path.

---

## 1. Device Tiers

### Tier 1: Pre-Built NAS (Synology / Ugreen)

**Recommended when:** Beginner skill level, low maintenance tolerance, "a few hours" setup time, moderate needs.

**Why Synology:**
- Best ecosystem for beginners. DSM (their OS) has a polished web UI.
- Native Docker support on Plus-series models (DS224+, DS423+, DS923+, DS1522+).
- Built-in apps for photos (Synology Photos), files (Synology Drive), backup, and more — you can use these OR run Docker containers alongside them.
- Large community, excellent documentation, well-tested hardware.
- Drawback: More expensive per-bay than DIY. CPU is weaker than comparable mini PCs. Vendor lock-in for some features (SHR RAID format).

**Why Ugreen:**
- Newer to the NAS market but competitive on price/performance.
- DXP series (DXP2800, DXP4800, DXP4800 Plus, DXP6800 Pro) runs UGOS, their own Linux-based OS with Docker support.
- Better hardware specs per dollar than Synology (Intel N100/N305 processors vs Synology's older Celerons).
- Good pick for someone who wants the pre-built form factor but plans to primarily use Docker rather than native NAS apps.
- Drawback: Newer ecosystem, smaller community, less mature software. Long-term support track record is unproven.

**Specific model recommendations by bay count:**

| Bays | Synology | Ugreen | Approx. Cost |
|------|----------|--------|-------------|
| 2-bay | DS224+ | DXP2800 | $300-350 |
| 4-bay | DS423+ / DS923+ | DXP4800 | $450-700 |
| 6-bay | DS1522+ | DXP6800 Pro | $700-900 |

**When to recommend 2-bay vs 4-bay:**
- 2-bay: Total storage need < 16 TB raw (e.g., 2× 8 TB in RAID 1 = 8 TB usable). Suitable for moderate media libraries + photos.
- 4-bay: Total storage need 16-60 TB raw, or need for RAID 5 resilience. Most versatile configuration.
- 6-bay: Total storage need > 60 TB, or mission-critical with RAID 6 + hot spare.

### Tier 2: Mini PC

**Recommended when:** Intermediate skill level, willing to spend a weekend, wants more power per dollar than a NAS, comfortable with Linux basics.

A mini PC gives you a proper x86 computer with more CPU/RAM than a NAS at the same price. You add external or internal storage separately.

**Specific configurations by workload:**

| Workload | CPU | RAM | Approx. Cost |
|----------|-----|-----|-------------|
| Basic (Jellyfin + *arr + Immich, 1-2 streams, no transcoding) | Intel N100 | 8-16 GB | $150-250 |
| Moderate (above + transcoding + more services) | Intel N305 / AMD 5600U | 16-32 GB | $300-500 |
| Heavy (4K transcoding + Immich ML + many services) | Intel i5-12th/13th gen / AMD 5700U | 32 GB | $400-700 |

**Storage attachment options for mini PCs:**
- Internal M.2 NVMe for OS + Docker configs (most mini PCs have 1-2 M.2 slots)
- USB 3.0/3.2 external drives or dock for media storage (simple but less reliable for 24/7)
- DAS (Direct Attached Storage) enclosure — essentially a JBOD box that connects via USB or Thunderbolt. Examples: Terramaster D4-300, ORICO multi-bay. $100-200 for 4-bay enclosure.
- Network share from existing NAS (if they already have storage elsewhere)

**Pros vs NAS:** Better CPU, more RAM, cheaper per compute, runs any Linux distro, more flexible.
**Cons vs NAS:** No built-in drive bays (need external solution), more DIY for storage, no purpose-built NAS OS.

### Tier 3: Use What You Already Own

**Recommended when:** Advanced skill level, already has hardware, wants to minimize cost.

**Common repurposable hardware:**
- Old desktop PC — often has plenty of SATA ports for drives, decent CPU. Add a $20-50 HBA card if you need more SATA ports.
- Old laptop — low power, limited storage expansion (usually 1 drive + USB), but works for a lightweight setup.
- Dell Optiplex / HP ProDesk / Lenovo ThinkCentre — extremely common in the used market ($80-200). SFF (Small Form Factor) models fit 1-2 3.5" drives. Tower models fit 3-4. Add an HBA for more.

**Adding more storage to existing machines:**
- **Internal SATA:** Most desktops have 4-6 SATA ports. Add drives directly.
- **HBA card (Host Bus Adapter):** $30-80 used on eBay (Dell H310, LSI 9211-8i). Adds 8 SATA/SAS ports. Flash to IT mode for use with any OS/software RAID.
- **JBOD enclosure:** External multi-bay enclosure ($100-250). Connects via USB, SAS, or Thunderbolt. No built-in RAID — the host manages drives directly. Good for expanding without replacing the machine.
- **USB drives:** Cheapest option. Fine for non-critical media storage. Not recommended for anything important due to USB reliability for 24/7 use.

**Key considerations:**
- Power consumption: An old desktop may draw 60-150W idle vs 10-25W for a mini PC. At $0.15/kWh, that's $5-15/month vs $1-3/month difference.
- Noise: Old desktops often have louder fans. Matters if the server is in a living space.
- Reliability: Consumer hardware wasn't designed for 24/7 operation, but most modern components handle it fine. The drives are the weak point, not the machine.

### Tier 4: Full Custom Build

**Recommended when:** Advanced user, large storage needs (8+ drives), wants specific hardware, enjoys building.

Not detailed here — these users know what they're doing. We provide guidance on:
- Case recommendations for many drive bays (Fractal Node 804, Silverstone CS381)
- PSU sizing for many drives (~12W per 3.5" HDD at spin-up)
- ECC RAM considerations (nice to have, not essential for home use)
- CPU selection for transcoding workloads

---

## 2. Storage Recommendations

### Drive Selection Guidance

**For media storage (bulk, sequential access):**
- 3.5" HDDs are the right choice. SSDs make no performance difference for media streaming.
- Recommend CMR (Conventional Magnetic Recording) over SMR (Shingled) drives. SMR drives have terrible write performance under sustained load.
- Good options: WD Red Plus (CMR, NAS-rated), Seagate IronWolf, Toshiba N300.
- Budget option: WD Elements/EasyStore external drives, shucked (removed from enclosure). Often the cheapest $/TB. Common approach in the self-hosting community but voids the external drive warranty.

**For OS + Docker configs (random I/O):**
- NVMe SSD. Even a small 250-500 GB drive dramatically improves service responsiveness.
- Docker container databases (Immich Postgres, Nextcloud DB) especially benefit from SSD.

**For Tdarr temp / transcoding scratch:**
- SSD strongly recommended. Transcoding writes and reads heavily. An HDD will be the bottleneck.
- A separate cheap SATA SSD works well ($30-50 for 500 GB).

### Drive Sizing Calculator

From the cost model (see `02-COST-MODEL.md`), we have `total_raw_capacity_needed`. 

```
Recommend the smallest number of drives that meets capacity:

Option A: Fewer large drives (simpler, fewer failure points)
  e.g., 2× 16 TB vs 4× 8 TB — same capacity, fewer drives

Option B: More smaller drives (cheaper per TB at some sizes, better RAID options)
  e.g., 4× 8 TB in RAID 5 = 24 TB usable with one drive of redundancy

Present both options with costs.
```

### RAID Recommendation

Based on data criticality from assessment:

| Criticality | RAID Level | Min Drives | Usable % | Recommendation Rationale |
|------------|-----------|-----------|---------|--------------------------|
| Replaceable | None / JBOD / mergerfs | 1+ | 100% | No redundancy needed. mergerfs pools drives without RAID overhead. |
| Important | RAID 1 (2 drives) or RAID 5 (4+ drives) | 2-4 | 50-75% | Survives one drive failure. |
| Critical | RAID 5 or RAID 6 | 4-6 | 67-75% | RAID 6 survives two simultaneous failures. |
| Mission-critical | RAID 6 + hot spare | 6+ | 57-67% | Hot spare begins rebuild immediately. |

**Important caveat (always display):** RAID protects against drive failure. It does NOT protect against accidental deletion, ransomware, fire, theft, or filesystem corruption. RAID is not backup. Off-site backup is the only protection against catastrophic loss.

**Software RAID options:**
- **mdadm** — Linux standard. Stable, well-documented, works everywhere. Recommended for advanced users.
- **mergerfs + SnapRAID** — Pooling + snapshot-based parity. Popular in the self-hosting community. Doesn't require all drives to be the same size. Better for media (not databases). Easier to recover individual drives. Recommended for intermediate users with mixed drive sizes.
- **ZFS** — Most robust but needs ECC RAM (ideally) and more learning. Recommended only for advanced users.
- **Synology SHR** — Synology's proprietary RAID. Allows mixed drive sizes. Easiest but only on Synology hardware.

---

## 3. RAM Recommendations

```
base_ram = 2 GB  (OS + Docker overhead)

per_service_ram = sum(selected_services[].resource_estimate.ram_mb)

# Key RAM-heavy services:
# Plex/Jellyfin: 512 MB - 2 GB (more with transcoding)
# Immich (with ML): 2-4 GB
# Nextcloud: 512 MB - 1 GB
# Each *arr app: 256 MB
# Each database (Postgres): 256-512 MB

recommended_ram = base_ram + per_service_ram
                  rounded up to nearest standard size (8, 16, 32 GB)
```

General guidance:
- **8 GB:** Sufficient for media server + *arr stack + light services
- **16 GB:** Comfortable for above + Immich + Nextcloud + several productivity apps
- **32 GB:** Full stack with everything, Immich ML with large libraries, or running VMs alongside

---

## 4. CPU Recommendations

### Transcoding Considerations

**No transcoding (direct play only):**
Any modern CPU works. Intel N100 is more than enough. Passmark score doesn't matter much.

**Software transcoding (no GPU):**
Rule of thumb: ~2000 Passmark per 1080p transcode stream. An Intel N100 (~5500 Passmark) handles 2-3 concurrent 1080p transcodes.

**Hardware transcoding (Intel QuickSync — recommended):**
Intel iGPU does the work. Massively more efficient than CPU. Most Intel CPUs from 7th gen+ support QuickSync. Intel N100/N305 handle 4-8+ concurrent streams via QuickSync.

**For 4K HDR tone-mapping:**
This is the hardest transcoding task. Intel 10th gen+ with QuickSync or Nvidia GPU recommended.

### Tdarr Pre-Transcoding

If the user selected Tdarr for library optimization:
- CPU/GPU will be under sustained load during initial library processing
- This can take days to weeks for large libraries
- Recommend running Tdarr processing during off-hours or at low priority
- GPU passthrough massively speeds this up

### CPU Recommendation by Workload

| Workload | Minimum CPU | Recommended |
|----------|------------|------------|
| No transcoding, basic services | Any dual-core (N100, J4125) | Intel N100 |
| 1-2 transcode streams | Intel N100 | Intel N305 |
| 3-5 transcode streams | Intel N305 / i3-12th gen | i5-12th/13th gen |
| 4K HDR tone mapping | Intel 12th gen+ | i5-12600 or Nvidia GPU |
| Heavy Immich ML + transcoding | Intel N305 + patience, or i5 | i5/i7 12th gen+ with 32 GB RAM |

---

## 5. Networking Recommendations

### Standard (most users)

Gigabit Ethernet is the baseline and sufficient for almost all home server use cases. A single gigabit link handles:
- 3-4 concurrent 4K streams (~25 Mbps each)
- Immich uploads from multiple devices
- File sync
- All of the above simultaneously (gigabit = ~940 Mbps usable ≈ 118 MB/s)

### Upgraded

**10 Gigabit Ethernet** — Only recommend when the user plans to:
- Edit video files directly off the server
- Transfer large files (100+ GB) regularly
- Run the server as a primary work NAS with concurrent heavy users

Cost: ~$50-100 per NIC (need one in server + one in workstation) + a 10GbE switch ($100-300) or direct connection.

### Wi-Fi Considerations

Immich mobile uploads and file sync work over Wi-Fi. Initial photo library upload of hundreds of GBs will be slow over Wi-Fi. Recommend wired connection for the initial bulk upload, then Wi-Fi is fine for ongoing sync.

---

## 6. UPS Sizing

If recommended:

```
ups_va = device_wattage × 1.5  (50% overhead for power factor and headroom)

# Minimum recommended runtime: 10 minutes (enough for safe shutdown)
# Budget: $80-150 for most home servers

# Common recommendation:
# APC Back-UPS 600VA — sufficient for mini PC + 2-4 HDDs
# APC Back-UPS 900VA-1500VA — for larger builds with more drives
# CyberPower CP1500AVRLCD — good mid-range option
```

Configure NUT (Network UPS Tools) in Docker to automatically shut down the server when battery is low. Include in compose if UPS is selected:

```yaml
services:
  nut-server:
    image: instantlinux/nut-upsd:latest
    container_name: nut-server
    environment:
      - API_USER=upsmon
      - API_PASSWORD=${NUT_PASSWORD}
    ports:
      - "3493:3493"
    devices:
      - /dev/bus/usb:/dev/bus/usb  # USB-connected UPS
    restart: unless-stopped
```

---

## 7. Total Hardware Cost Estimate

The results page shows:

```
Hardware Cost Breakdown
═══════════════════════

Server/NAS device:        $XXX - $XXX
  └─ Recommended: [specific model]

Storage drives:           $XXX - $XXX
  └─ X × Y TB drives

OS/Cache SSD:             $XXX
  └─ X GB NVMe

Accessories:
  └─ UPS:                 $XXX (if recommended)
  └─ DAS/enclosure:       $XXX (if needed)
  └─ Cables/adapters:     $XX

──────────────────────────
Total estimated:          $XXX - $XXX
```

Show low (budget) and high (recommended) estimates. Provide a "sweet spot" pick with rationale.
