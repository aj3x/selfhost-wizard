# Phase 1 — Cost Model

## Overview

All calculations run client-side in the browser. Inputs come from the assessment wizard (see `01-ASSESSMENT-WIZARD.md`). Outputs feed the results screen and the hardware recommendations in Phase 2.

---

## 1. Current Monthly SaaS Cost

Simple sum:

```
current_monthly = sum(streaming_services[].cost)
               + sum(music_services[].cost)
               + sum(cloud_storage[].cost)
               + sum(photo_backup[].cost)
               + vpn_service.cost
               + sum(other_services[].cost)
```

Display as both monthly and annual.

---

## 2. Storage Estimation

### 2.1 Media Storage

```
movie_storage = library_size.movies × avg_size_per_movie[video_quality]
tv_storage = library_size.tv_seasons × avg_episodes_per_season × avg_size_per_episode[video_quality]
music_storage = music_library_size_gb  (if manually entered)
             OR music_estimate[collection_size] (if using presets)
```

**Average file sizes by quality:**

| Quality Tier | Movie (avg) | TV Episode (avg) | Notes |
|-------------|-------------|-------------------|-------|
| 1080p | 6 GB | 2 GB | Compressed x264/x265 |
| 4K SDR | 30 GB | 8 GB | Good quality encode |
| 4K HDR/DV | 60 GB | 12 GB | High bitrate / remux |

**Music estimates:**

| Collection | Lossy (MP3/AAC) | Lossless (FLAC) |
|------------|-----------------|-----------------|
| Small (<2K tracks) | ~10 GB | ~40 GB |
| Medium (2-10K tracks) | ~50 GB | ~200 GB |
| Large (10K+ tracks) | ~150 GB | ~600 GB |

### 2.2 Photo/Video Storage

```
existing_photos = user_input_gb  OR  estimated_from_years_and_devices
annual_growth = sum(devices[].estimated_annual_gb)
```

**Per-device annual estimates:**

| Device Type | Light Use | Moderate Use | Heavy Use |
|-------------|-----------|-------------|-----------|
| Phone (photos) | 10 GB/yr | 30 GB/yr | 80 GB/yr |
| Phone (video) | 20 GB/yr | 80 GB/yr | 300 GB/yr |
| DSLR/Mirrorless (RAW) | 50 GB/yr | 200 GB/yr | 500 GB/yr |
| Action cam / Drone (video) | 50 GB/yr | 200 GB/yr | 500 GB/yr |

### 2.3 File Backup Storage

```
file_storage = sum(computers[].backup_size_gb)
             × versioning_multiplier
```

**Versioning multiplier:**
- No versioning (sync only): 1.0x
- Basic versioning (30 days): 1.3x
- Aggressive versioning (90 days): 1.5x

### 2.4 Application & OS Overhead

```
system_overhead = 100 GB  (Docker images, configs, databases, logs, OS)
```

### 2.5 Total Raw Storage Need

```
raw_storage = movie_storage + tv_storage + music_storage
            + photo_storage + annual_photo_growth × 3 (3 year projection)
            + file_storage
            + system_overhead
```

### 2.6 Usable vs Raw Storage (RAID Overhead)

```
raid_overhead = {
  "none":   1.0,     # No redundancy
  "raid1":  0.5,     # Mirror — 50% usable
  "raid5":  (n-1)/n, # One parity drive — e.g., 4 drives = 75% usable
  "raid6":  (n-2)/n, # Two parity drives — e.g., 6 drives = 67% usable
  "raid10": 0.5      # Mirror + stripe — 50% usable
}

total_raw_capacity_needed = raw_storage / raid_overhead[selected_raid]
```

**RAID recommendation by criticality:**

| Data Criticality | Recommended RAID | Min Drives |
|-----------------|-----------------|-----------|
| Replaceable | None or JBOD | 1 |
| Important | RAID 1 (small) or RAID 5 (4+ drives) | 2-4 |
| Critical | RAID 5 or RAID 6 | 4-6 |
| Mission-critical | RAID 6 + hot spare | 6+ |

### 2.7 Growth Projection

Project storage needs at 1, 3, and 5 years. Assume:
- Media growth: 20-50% of initial library size per year (user-adjustable)
- Photo/video growth: annual rate from Q4.2
- File growth: 10% per year (default)

Show a chart of projected storage use vs capacity to help users size appropriately.

---

## 3. Hardware Cost Estimation

### 3.1 Server/NAS Device Cost

Based on skill level and needs, recommend tiers:

| Tier | Example | Approx. Cost | For Whom |
|------|---------|-------------|----------|
| Pre-built NAS (basic) | Synology DS224+, Ugreen DXP2800 | $300-400 | Beginners, low stream count |
| Pre-built NAS (mid) | Synology DS923+, Ugreen DXP4800 | $500-700 | Intermediate, 4 bays, some transcoding |
| Mini PC (value) | Intel N100 mini PC | $150-250 | Good enough for most users, add external storage |
| Mini PC (capable) | Intel N305/AMD 5600U mini PC | $300-500 | Multiple transcodes, Immich ML |
| Full build (mid) | Used Dell Optiplex/HP ProDesk + HBA | $200-400 | Advanced, existing hardware path |
| Full build (high) | Custom build with case, PSU, HBA | $500-1000+ | Power users, many drives |

### 3.2 Hard Drive Cost

```
drive_cost = ceil(total_raw_capacity_needed / drive_size) × price_per_drive

# Current approximate pricing (HDD):
# 4 TB:  ~$70  ($17.50/TB)
# 8 TB:  ~$120 ($15.00/TB)
# 12 TB: ~$180 ($15.00/TB)
# 16 TB: ~$230 ($14.38/TB)
# 18 TB: ~$270 ($15.00/TB)
# 20 TB: ~$330 ($16.50/TB)

# SSD pricing (for OS/cache/fast storage):
# 500 GB NVMe: ~$45
# 1 TB NVMe:   ~$70
# 2 TB NVMe:   ~$130
```

Recommend drive sizes that minimize cost while meeting capacity. Prefer fewer larger drives (simpler, fewer failure points) unless RAID requires a minimum count.

### 3.3 Accessories

| Item | Cost Range | When Recommended |
|------|-----------|-----------------|
| UPS (battery backup) | $80-200 | RAID users, critical data |
| Ethernet cable (Cat6) | $5-15 | Always |
| USB HDD dock/enclosure | $30-60 | If using mini PC + external drives |
| HBA card (SAS/SATA) | $30-80 | Full builds needing many drive ports |
| 10GbE NIC | $50-100 | Working off the server (video editing) |
| RAM upgrade | $30-80 | If running Immich ML or many services |

### 3.4 Total Upfront Cost

```
total_upfront = device_cost + drive_cost + accessories_cost
```

Present as a range (low/high estimate).

---

## 4. Ongoing Monthly Cost

### 4.1 Electricity Cost

```
monthly_electricity = device_wattage × 24 × 30.44 / 1000 × electricity_rate_per_kwh
```

**Estimated wattage by device type:**

| Device Type | Idle (W) | Load (W) | Avg 24/7 (W) |
|------------|----------|----------|---------------|
| Synology 2-bay (HDD spinning) | 15 | 25 | 18 |
| Synology 4-bay (HDD spinning) | 25 | 40 | 30 |
| Mini PC (N100, no HDDs) | 6 | 15 | 10 |
| Mini PC (N100, 2x HDD) | 16 | 30 | 22 |
| Mini PC (N305, 2x HDD) | 20 | 45 | 28 |
| Full build (4 HDDs, idle) | 50 | 120 | 65 |
| Full build (8 HDDs, idle) | 70 | 160 | 90 |

**Per-drive adder:**
- 3.5" HDD: ~5-8W active, ~3-5W idle
- 2.5" SSD: ~1-3W active, ~0.5W idle
- NVMe: ~3-5W active, ~0.05W idle

### 4.2 VPN Cost

```
monthly_vpn = vpn_service.cost  (if not already subscribed: ~$5/month)
```

### 4.3 Domain Cost

```
monthly_domain = domain_annual_cost / 12  (if applicable: ~$1/month)
```

### 4.4 Off-Site Backup Cost

```
monthly_offsite = offsite_storage_gb / 1000 × rate_per_tb_month

# Backblaze B2: ~$5/TB/month storage + $10/TB egress
# Wasabi: ~$7/TB/month, no egress fees
# Another machine you control: $0 (but factor in that machine's electricity)
```

Only critical/irreplaceable data should be backed up off-site (photos, documents — not media library).

### 4.5 Total Monthly Self-Hosted Cost

```
monthly_selfhosted = monthly_electricity
                   + monthly_vpn
                   + monthly_domain
                   + monthly_offsite
```

---

## 5. Drive Failure & Replacement Cost

### 5.1 Annualized Failure Rate (AFR)

Industry average AFR for consumer HDDs: ~1.5-2.5% per year (varies by model/brand). We use 2% as default.

```
expected_failures_per_year = num_drives × AFR
annualized_replacement_cost = expected_failures_per_year × cost_per_drive
```

**Example:** 4 drives × 2% AFR = 0.08 expected failures/year. At $180/drive = $14.40/year annualized cost.

### 5.2 Warranty Consideration

Most consumer drives have 2-3 year warranties. NAS-rated drives (WD Red Pro, Seagate IronWolf) typically have 5 years.

```
if drive_age < warranty_years:
    replacement_cost = $0 (warranty covers it)
else:
    replacement_cost = cost_per_drive

# For cost projection, we amortize post-warranty replacement:
warranty_adjusted_annual_cost = 
    if year <= warranty_years: $0
    else: expected_failures_per_year × cost_per_drive
```

### 5.3 Risk of Data Loss

Without RAID or backup, a single drive failure means total data loss for data on that drive.

```
annual_risk_of_any_failure = 1 - (1 - AFR) ^ num_drives

# 4 drives at 2% AFR: 1 - 0.98^4 = 7.8% chance of at least one failure per year
# 8 drives at 2% AFR: 1 - 0.98^8 = 14.9% chance
```

**With RAID 5:** Data loss requires 2 simultaneous failures. Annual risk of data loss drops dramatically (~0.06% for 4 drives).

**Without RAID:** Any single failure could mean data loss. We should prominently display this risk if they chose no redundancy for important data.

Present this as: "Over 5 years with 4 unprotected drives, there's roughly a 34% chance you'll experience at least one drive failure."

---

## 6. Break-Even Calculation

### 6.1 Simple Break-Even

```
monthly_savings = current_monthly_saas - monthly_selfhosted
break_even_months = total_upfront / monthly_savings
```

If monthly_savings ≤ 0, self-hosting doesn't save money (flag this — may still be worth it for privacy/control/features, but cost isn't the argument).

### 6.2 Risk-Adjusted Break-Even

```
annual_total_cost_selfhosted = (monthly_selfhosted × 12)
                             + annualized_drive_replacement_cost
                             + (initial_drives_replacement_cycle / drive_lifespan_years)

annual_savings = (current_monthly_saas × 12) - annual_total_cost_selfhosted
risk_adjusted_break_even = total_upfront / (annual_savings / 12)
```

### 6.3 5-Year Total Cost of Ownership

```
year_1 = total_upfront + (monthly_selfhosted × 12)
year_2_5 = monthly_selfhosted × 12 + annualized_drive_replacement_cost

five_year_tco = year_1 + (year_2_5 × 4)
five_year_saas = current_monthly_saas × 60

five_year_savings = five_year_saas - five_year_tco
```

Display this as a chart showing cumulative cost over time: SaaS line (straight) vs self-hosted line (high initial, then shallow).

---

## 7. Cloud-Hosted Alternative

For users with slow upload, high remote access needs, or low maintenance tolerance:

```
cloud_monthly = hetzner_dedicated_server_cost  # ~$30-60/month for suitable specs
              + storage_cost                    # Hetzner storage box: ~$3.50/TB/month
              + bandwidth                       # Usually included

cloud_five_year = cloud_monthly × 60
```

Compare: SaaS vs self-hosted-local vs cloud-hosted-remote.

This alternative is especially relevant when:
- Upload speed < 20 Mbps AND remote access is important
- User is beginner AND low maintenance tolerance
- Data is not highly sensitive (acceptable to have on a provider)

---

## 8. Value Factors (Non-Financial)

The results page should also address qualitative factors:

**Privacy:** Your data stays on hardware you control (local) or a server you control (cloud). No scanning, no training AI models on your photos, no account termination risk.

**Control:** No price hikes, no content removal, no "this content is no longer available in your region."

**Learning:** Building and maintaining a server teaches valuable skills.

**Fun factor:** For many people, this is a hobby. The tinkering is the point.

**Family utility:** Shared photo libraries, family media server, centralized backup — practical value beyond cost.

These should be presented alongside the numbers so users who are close to break-even can factor in what matters to them.
