# Design Decisions

## Overview

This document covers UI/UX patterns, component architecture, state management, and responsive design. It serves as the design spec that will inform the implementation.

---

## 1. UI/UX Philosophy

### Progressive Disclosure

The tool handles a massive amount of information. The core UX principle is: **show only what's relevant right now.** Every screen should feel manageable, never overwhelming.

- Questions that don't apply (based on prior answers) are hidden, not disabled.
- Advanced options exist behind expandable sections, collapsed by default for beginners.
- Tooltips and "Why?" links provide context without cluttering the main flow.
- The wizard saves progress — users can leave and return.

### Adaptive Complexity

The tech-savvy question (Q1.1) isn't just about recommendations — it controls the entire UI:

| Element | Beginner | Intermediate | Advanced |
|---------|----------|-------------|---------|
| Language | Plain English, analogies | Technical but explained | Technical, concise |
| Choices | Curated (1-2 options) | Moderate (3-4 options) | Full menu |
| Defaults | Pre-selected, opinionated | Pre-selected, changeable | Nothing pre-selected |
| Tooltips | Shown by default | Available on hover | Minimal |
| Warnings | Prominent, detailed | Standard | Subtle |
| Docker output | Commented heavily | Key comments | Clean YAML |

### Feedback Loops

Every input should produce visible feedback:
- Checking a streaming service → running total updates immediately
- Adjusting library size slider → storage estimate changes in real time
- Selecting a service → dependency tree lights up
- Changing RAID level → usable capacity recalculates

### Completion Momentum

The wizard should feel like progress. Each screen completion gives a visual indicator of how far along the user is. The results page should feel like a reward — "here's your personalized plan."

---

## 2. Information Architecture

### Site Structure

```
/                           → Landing page (what is this, who is it for)
/assess                     → Phase 1: Assessment Wizard
/assess/results             → Phase 1: Results Dashboard
/configure                  → Phase 2: Service Configurator
/configure/review           → Phase 2: Review & Download
/setup                      → Phase 3: Guided Setup (future)
/tools                      → Standalone tools index
/tools/subscription-calc    → Subscription cost calculator (standalone)
/tools/storage-estimator    → Storage needs estimator (standalone)
/tools/electricity-calc     → Electricity cost calculator (standalone)
/tools/break-even           → Break-even calculator (standalone)
/tools/drive-risk           → Drive failure risk calculator (standalone)
/tools/photo-size           → Photo library size estimator (standalone)
/about                      → About the project, contribute, etc.
```

Each `/tools/*` route renders the same component used inside the wizard, but with its own input form instead of drawing from the shared assessment store. This means:
- Tools are independently linkable and shareable
- Tools can accept URL parameters for pre-filling (e.g., `/tools/electricity-calc?watts=22&rate=0.16`)
- Inside the wizard, the same component receives data from the store and emits results back to it
- A tool used standalone shows a CTA: "Want a full assessment? → Start the wizard"

### Navigation

- **Wizard screens:** Linear progression with back/next buttons. Progress bar at top.
- **Results page:** Scrollable single page with sections. "Proceed to Configurator" CTA.
- **Configurator:** Tab/category-based selection. Summary sidebar.
- **Global:** Minimal nav. Logo → home. No heavy header/footer.

---

## 3. Component Architecture (Svelte)

### Core Layout Components

```
src/lib/components/
├── layout/
│   ├── WizardShell.svelte       # Wrapper for wizard screens (progress bar, nav)
│   ├── ScreenTransition.svelte   # Animated transitions between screens
│   └── PageShell.svelte          # Generic page wrapper
├── wizard/
│   ├── QuestionGroup.svelte      # Groups related questions with a title
│   ├── SingleSelect.svelte       # Radio-style single selection
│   ├── MultiSelect.svelte        # Checkbox-style multi selection
│   ├── ServiceCheckbox.svelte    # Toggleable service card with icon/description
│   ├── SliderInput.svelte        # Range slider with numeric display
│   ├── NumberInput.svelte        # Numeric input with increment/decrement
│   ├── CurrencyInput.svelte      # Currency-aware numeric input
│   ├── DeviceList.svelte         # Repeatable device entry (add/remove)
│   ├── RepeatableEntry.svelte    # Generic add/remove row list (used for Q3.6 "Other" entries)
│   ├── Tooltip.svelte            # Contextual help
│   └── ConditionalSection.svelte # Show/hide based on condition (animated)
├── tools/                         # STANDALONE CALCULATORS (used both in wizard and at /tools/*)
│   ├── SubscriptionCalc.svelte   # Subscription cost tracker — totals monthly SaaS spend
│   ├── StorageEstimator.svelte   # Storage needs calculator — media + photos + files → TB
│   ├── ElectricityCalc.svelte    # Electricity cost — wattage × uptime × rate
│   ├── BreakEvenCalc.svelte      # Break-even timeline — upfront vs monthly savings
│   ├── DriveRiskCalc.svelte      # Drive failure probability — drives × AFR × years
│   ├── PhotoSizeEstimator.svelte # Photo library sizing — devices × years × usage
│   └── ToolWrapper.svelte        # Shared wrapper: standalone mode (own inputs) vs embedded mode (store-connected)
├── results/
│   ├── CostComparison.svelte     # Side-by-side cost breakdown
│   ├── BreakEvenChart.svelte     # Visual break-even timeline
│   ├── StorageEstimate.svelte    # Storage breakdown visualization
│   ├── RecommendationCard.svelte # The final recommendation tier
│   ├── RiskIndicator.svelte      # Visual risk level display
│   └── ShareCard.svelte          # Shareable summary image/link
├── configurator/
│   ├── ServiceGrid.svelte        # Category-grouped service selection
│   ├── ServiceCard.svelte        # Individual service toggle card
│   ├── DependencyResolver.svelte # UI for resolving missing dependencies
│   ├── ConflictResolver.svelte   # UI for resolving service conflicts
│   ├── ComposePreview.svelte     # Live preview of docker-compose.yml
│   ├── EnvEditor.svelte          # Environment variable editor
│   └── PortTable.svelte          # Port allocation overview
├── config/
│   ├── DefaultsPanel.svelte      # Configurable defaults/assumptions editor
│   └── DefaultsResetButton.svelte # Reset all to defaults
└── shared/
    ├── RunningTotal.svelte        # Floating/sticky cost total
    ├── ProgressBar.svelte         # Wizard progress indicator
    ├── Badge.svelte               # Skill level badge
    ├── Alert.svelte               # Warning/info messages
    └── CodeBlock.svelte           # Syntax-highlighted code display
```

### Standalone Tool Architecture

Each tool component accepts two modes via a `mode` prop:

```typescript
// ToolWrapper.svelte pattern
interface ToolProps {
  mode: 'standalone' | 'embedded';
  // In standalone mode: tool manages its own inputs
  // In embedded mode: tool reads from / writes to the assessment store
  initialValues?: Partial<ToolInputs>;  // for URL params in standalone mode
}
```

When embedded in the wizard, the tool's inputs are pre-filled from the store and its outputs flow back. When standalone, it renders its own input form and shows results immediately.

Each standalone tool page (`/tools/storage-estimator`) is a thin wrapper:

```svelte
<!-- src/routes/tools/storage-estimator/+page.svelte -->
<script>
  import StorageEstimator from '$lib/components/tools/StorageEstimator.svelte';
  import { page } from '$app/stores';
  
  // Parse URL params for pre-filling
  const initialValues = Object.fromEntries($page.url.searchParams);
</script>

<StorageEstimator mode="standalone" {initialValues} />
```

### State Management

**Svelte stores** for global state. No external state library needed.

```typescript
// src/lib/stores/assessment.ts
import { writable, derived } from 'svelte/store';
import type { AssessmentState } from '$lib/types';

export const assessment = writable<AssessmentState>({
  skillLevel: null,
  householdSize: null,
  electricityRate: null,
  // ... all assessment fields with null defaults
});

// Derived stores for calculations
export const totalMonthlySaaS = derived(assessment, ($a) => {
  return sumServices($a.streamingServices)
       + sumServices($a.musicServices)
       + sumServices($a.cloudStorage)
       + sumServices($a.photoBackup)
       + ($a.vpnService?.cost ?? 0)
       + sumServices($a.otherServices);  // Q3.6 now includes costs
});

export const estimatedStorage = derived(
  [assessment, defaults],
  ([$a, $d]) => {
    return calculateStorage($a, $d);  // pass defaults for growth rates, multipliers, etc.
  }
);

export const recommendation = derived(
  [assessment, totalMonthlySaaS, estimatedStorage, defaults],
  ([$a, $saas, $storage, $d]) => {
    return generateRecommendation($a, $saas, $storage, $d);
  }
);
```

**Configurable defaults store:**

```typescript
// src/lib/stores/defaults.ts
import { writable } from 'svelte/store';
import type { CalculationDefaults } from '$lib/types';

// These are the "factory defaults" — never mutated
export const FACTORY_DEFAULTS: CalculationDefaults = {
  // Storage estimation
  avgEpisodesPerSeason: 10,
  mediaGrowthRateAnnual: 0.30,
  fileGrowthRateAnnual: 0.10,
  growthProjectionYears: 3,
  storageHeadroomMultiplier: 1.15,
  
  // Drive failure
  hddAfr: 0.02,
  ssdAfr: 0.005,
  nasDriveAfr: 0.015,
  consumerWarrantyYears: 3,
  nasWarrantyYears: 5,
  driveLifespanYears: 6,
  
  // Versioning
  versioningMultiplierNone: 1.0,
  versioningMultiplierBasic: 1.3,
  versioningMultiplierAggressive: 1.5,
  
  // Electricity
  defaultUptimeHours: 24,
  defaultUptimeDaysPerMonth: 30.44,
  
  // Costs
  offsiteCostPerTbMonth: 5.00,
  domainAnnualCost: 12.00,
  vpnMonthlyDefault: 5.46,
  plexPassMonthly: 5.00,
  
  // Break-even
  tcoProjectionYears: 5,
  saasPriceInflationAnnual: 0.00,  // off by default, user can enable
};

export const defaults = writable<CalculationDefaults>({ ...FACTORY_DEFAULTS });

export function resetDefaults() {
  defaults.set({ ...FACTORY_DEFAULTS });
}
```

Every calculation function takes `defaults` as a parameter rather than using hardcoded values. This means changing a default in the panel instantly recalculates everything.

**LocalStorage persistence:**

```typescript
// src/lib/stores/persist.ts
import { assessment } from './assessment';
import { defaults, FACTORY_DEFAULTS } from './defaults';

// Save on every change
assessment.subscribe(value => {
  localStorage.setItem('selfhost-assessment', JSON.stringify(value));
});
defaults.subscribe(value => {
  localStorage.setItem('selfhost-defaults', JSON.stringify(value));
});

// Restore on load
const savedAssessment = localStorage.getItem('selfhost-assessment');
if (savedAssessment) {
  assessment.set(JSON.parse(savedAssessment));
}
const savedDefaults = localStorage.getItem('selfhost-defaults');
if (savedDefaults) {
  defaults.set(JSON.parse(savedDefaults));
}
```

**Export/import** for sharing or backup:

```typescript
export function exportState() {
  return JSON.stringify({
    version: 1,
    assessment: get(assessment),
    configuration: get(configuration),
    defaults: get(defaults),
    timestamp: Date.now(),
  });
}

export function importState(json: string) {
  const data = JSON.parse(json);
  if (data.version === 1) {
    assessment.set(data.assessment);
    configuration.set(data.configuration);
    if (data.defaults) defaults.set(data.defaults);
  }
}
```

---

## 4. Compose Generation Engine

### Service Registry Pattern

```typescript
// src/lib/services/registry.ts
import { jellyfin } from './jellyfin';
import { sonarr } from './sonarr';
import { gluetun } from './gluetun';
// ... all services

export const serviceRegistry: Map<string, ServiceModule> = new Map([
  ['jellyfin', jellyfin],
  ['sonarr', sonarr],
  ['gluetun', gluetun],
  // ...
]);

// Categories for UI grouping
export const serviceCategories: ServiceCategory[] = [
  { id: 'media-server', name: 'Media Server', icon: '...' },
  { id: 'media-management', name: 'Media Management', icon: '...' },
  // ...
];
```

### Compose Builder

```typescript
// src/lib/compose/builder.ts

export function buildCompose(
  selectedServiceIds: string[],
  userConfig: UserConfig
): ComposeOutput {
  // 1. Resolve dependencies
  const allServices = resolveDependencies(selectedServiceIds);
  
  // 2. Check conflicts
  const conflicts = checkConflicts(allServices);
  if (conflicts.length > 0) throw new ConflictError(conflicts);
  
  // 3. Collect networks
  const networks = collectNetworks(allServices);
  
  // 4. Handle VPN routing
  const { services, vpnPorts } = handleVpnRouting(allServices, userConfig);
  
  // 5. Build compose fragments
  const fragments = services.map(s => 
    serviceRegistry.get(s)!.compose(userConfig)
  );
  
  // 6. Assemble
  const compose = assembleCompose(fragments, networks);
  
  // 7. Generate .env
  const env = generateEnv(services, userConfig);
  
  // 8. Generate setup script
  const setup = generateSetupScript(services, userConfig);
  
  // 9. Generate ancillary configs (Caddyfile, homepage config, etc.)
  const extras = generateExtras(services, userConfig);
  
  return { compose, env, setup, extras };
}
```

### YAML Serialization

Use a YAML library (js-yaml) rather than string templating. Build the compose as a JavaScript object, then serialize.

```typescript
import YAML from 'js-yaml';

function serializeCompose(compose: ComposeObject): string {
  return YAML.dump(compose, {
    indent: 2,
    lineWidth: -1, // no wrapping
    noRefs: true,
    sortKeys: false, // preserve insertion order
  });
}
```

---

## 5. Responsive Design

### Breakpoints

| Name | Width | Target |
|------|-------|--------|
| Mobile | < 640px | Phones |
| Tablet | 640-1024px | Tablets, small laptops |
| Desktop | > 1024px | Laptops, monitors |

### Layout Adaptations

**Wizard screens:**
- Mobile: Full-width, stacked questions, floating bottom nav
- Tablet: Centered content (max 640px), standard nav
- Desktop: Centered content (max 720px), sidebar progress indicator

**Results page:**
- Mobile: Stacked cards, charts scale to width
- Desktop: Two-column layout for cost comparison, full-width charts

**Configurator:**
- Mobile: Single-column service list, collapsible categories
- Tablet: Two-column grid
- Desktop: Three-column grid with sticky summary sidebar

**Compose output:**
- Mobile: Full-width code block with horizontal scroll, copy button
- Desktop: Side-by-side code preview and settings panel

---

## 6. Accessibility

- All interactive elements keyboard-navigable
- ARIA labels on custom components (sliders, toggles)
- Color is never the only indicator (always paired with text/icon)
- Focus management during screen transitions
- Reduced motion preference respected for animations
- Minimum contrast ratios for all text

---

## 7. Performance Budget

Target: Lighthouse score > 90 on all metrics.

- **Initial JS bundle:** < 100 KB gzipped (Svelte + calculation engine)
- **No external API calls** in Phase 1-2 (everything runs locally)
- **No images** in the core flow (use SVG icons, CSS illustrations)
- **Lazy load** Phase 2 and Phase 3 code (most users will start with Phase 1)
- **Service worker** for offline support (the tool should work without internet once loaded)

### Code Splitting Strategy

```
routes/
├── +page.svelte                    → Landing (tiny)
├── assess/
│   ├── +page.svelte                → Wizard (core bundle)
│   └── results/
│       └── +page.svelte            → Results (includes chart library, lazy loaded)
├── configure/
│   ├── +page.svelte                → Configurator (lazy loaded)
│   └── review/
│       └── +page.svelte            → Review + compose generation (lazy loaded, includes YAML lib)
├── tools/
│   ├── +page.svelte                → Tools index (tiny — just links)
│   ├── subscription-calc/
│   │   └── +page.svelte            → Standalone subscription calculator
│   ├── storage-estimator/
│   │   └── +page.svelte            → Standalone storage estimator
│   ├── electricity-calc/
│   │   └── +page.svelte            → Standalone electricity calculator
│   ├── break-even/
│   │   └── +page.svelte            → Standalone break-even calculator
│   ├── drive-risk/
│   │   └── +page.svelte            → Standalone drive failure risk calculator
│   └── photo-size/
│       └── +page.svelte            → Standalone photo library estimator
└── setup/
    └── +page.svelte                → Guided setup (lazy loaded, future)
```

Each `/tools/*` page is a thin wrapper around the corresponding `$lib/components/tools/*.svelte` component in standalone mode. The tool components themselves are shared with the wizard — they're part of the core bundle but each standalone page only imports the one it needs.

---

## 8. Data Model

### Types

```typescript
// src/lib/types.ts

// Assessment data
interface AssessmentState {
  // Screen 1
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | null;
  householdSize: number | null;
  location: LocationConfig | null;
  electricityRate: number | null; // $/kWh
  currency: string; // USD, CAD, EUR, GBP, AUD
  downloadSpeed: number | null; // Mbps
  uploadSpeed: number | null;
  
  // Screen 2
  streamingServices: ServiceCost[];
  musicServices: ServiceCost[];
  cloudStorage: StorageServiceCost[];
  photoBackup: ServiceCost[];
  vpnService: ServiceCost | null;
  otherServices: OtherServiceCost[];  // Q3.6 — now with optional costs
  
  // Screen 3
  mediaAcquisition: 'physical' | 'digital' | 'existing' | 'other' | null;
  videoQuality: '720p' | '1080p' | '4k' | '4k_hdr' | null;  // added 720p
  librarySize: { movies: number; tvSeasons: number };
  concurrentStreams: number;
  needsTranscoding: boolean | null;
  wantsAutomation: 'full' | 'semi' | 'manual' | null;
  wantsMusic: boolean;
  musicLibrarySize: number | null; // GB
  wantsLossless: boolean;
  
  // Screen 4
  wantsPhotoBackup: boolean;
  photoDevices: PhotoDevice[];
  existingPhotoLibrary: number; // GB — always shown prominently
  wantsMLFeatures: boolean;
  
  // Screen 5
  wantsFileSync: boolean;
  computers: ComputerBackup[];
  backupType: 'sync' | 'versioned' | 'both' | null;
  worksOffServer: 'heavy' | 'occasional' | 'no' | null;
  needsPersonalSpaces: boolean;
  
  // Screen 6
  remoteAccess: 'none' | 'occasional' | 'regular' | 'share' | null;
  hasVPN: boolean;
  comfortableWithPorts: boolean;
  wantsDomain: boolean;
  wantsAdBlocking: boolean;
  
  // Screen 7
  dataCriticality: 'replaceable' | 'important' | 'critical' | 'mission_critical' | null;
  riskTolerance: 'minimal' | 'cautious' | 'standard' | 'advanced' | null;
  wantsOffsiteBackup: 'cloud' | 'own_location' | 'no' | null;
  wantsUPS: boolean;
  
  // Screen 8
  setupTimeBudget: 'hours' | 'weekend' | 'take_time' | 'unlimited' | null;
  maintenanceTimeBudget: 'minimal' | 'some' | 'regular' | null;
  breakTolerance: 'low' | 'medium' | 'high' | null;
  hasHelp: 'yes' | 'no' | 'ai' | null;
  
  // BYOD (Bring Your Own)
  byod: BYODConfig;
  
  // Uptime schedule
  uptimeSchedule: UptimeSchedule;
}

interface ServiceCost {
  id: string;
  name: string;
  cost: number; // monthly
  selected: boolean;
}

// Q3.6 — "Other" services with optional cost and custom name
interface OtherServiceCost {
  id: string;
  name: string;          // user-entered service name
  cost: number;          // monthly cost ($0 if free/unknown)
  category?: string;     // optional categorization
  selected: boolean;
}

interface PhotoDevice {
  id: string;
  type: 'phone' | 'tablet' | 'dslr' | 'action_cam' | 'drone';
  photoCount: 'small' | 'medium' | 'large';
  shootsVideo: 'yes' | 'some' | 'rarely';
}

interface ComputerBackup {
  id: string;
  sizeGB: number;
}

// BYOD — user's existing hardware
interface BYODConfig {
  usingOwnMachine: boolean;
  machineWattage?: number;           // override wattage if known
  existingDrives: ExistingDrive[];
  existingSSDs: ExistingSSD[];
  hasUPS: boolean;
  hasNetworkingGear: boolean;
}

interface ExistingDrive {
  id: string;
  sizeGB: number;
  type: 'hdd' | 'ssd';
  ageYears: number;         // for failure risk calculation
  isNASRated: boolean;      // affects warranty and AFR
}

interface ExistingSSD {
  id: string;
  sizeGB: number;
  type: 'sata' | 'nvme';
}

// Uptime schedule
interface UptimeSchedule {
  preset: '24_7' | 'daytime' | 'evenings_weekends' | 'weekends' | 'on_demand' | 'custom';
  customHoursPerDay?: number;
  customDaysPerMonth?: number;
}

// Configurable defaults (see 02-COST-MODEL.md Section 9)
interface CalculationDefaults {
  // Storage estimation
  avgEpisodesPerSeason: number;
  mediaGrowthRateAnnual: number;
  fileGrowthRateAnnual: number;
  growthProjectionYears: number;
  storageHeadroomMultiplier: number;
  
  // Drive failure
  hddAfr: number;
  ssdAfr: number;
  nasDriveAfr: number;
  consumerWarrantyYears: number;
  nasWarrantyYears: number;
  driveLifespanYears: number;
  
  // Versioning
  versioningMultiplierNone: number;
  versioningMultiplierBasic: number;
  versioningMultiplierAggressive: number;
  
  // Electricity
  defaultUptimeHours: number;
  defaultUptimeDaysPerMonth: number;
  
  // Costs
  offsiteCostPerTbMonth: number;
  domainAnnualCost: number;
  vpnMonthlyDefault: number;
  plexPassMonthly: number;
  
  // Break-even
  tcoProjectionYears: number;
  saasPriceInflationAnnual: number;
}

// Configuration data (Phase 2)
interface ConfigurationState {
  selectedServices: string[];
  vpnProvider: VPNProvider | null;
  vpnCredentials: Record<string, string>;
  globalConfig: GlobalConfig;
  serviceConfigs: Record<string, Record<string, string>>;
}

// Calculation results
interface CostAnalysis {
  currentMonthlySaaS: number;
  selfHostedMonthly: number;
  monthlyElectricity: number;
  monthlyVPN: number;
  monthlyDomain: number;
  monthlyOffsite: number;
  upfrontHardware: { low: number; high: number };
  upfrontDrives: { low: number; high: number };
  upfrontAccessories: number;
  byodSavings: number;             // how much BYOD reduces upfront cost
  breakEvenMonths: number;
  riskAdjustedBreakEven: number;
  fiveYearTCO: number;
  fiveYearSaaS: number;
  annualizedDriveFailure: number;
  storageNeeded: StorageBreakdown;
  recommendation: RecommendationTier;
}
```

---

## 9. Testing Strategy

### Unit Tests
- Cost model calculations (deterministic, testable)
- Dependency resolution logic
- Compose generation (compare output YAML to snapshots)
- VPN routing logic

### Component Tests
- Wizard flow (screen transitions, conditional rendering)
- State persistence (localStorage round-trip)
- Accessibility (keyboard navigation, ARIA)

### Integration Tests
- Full wizard completion → results match expected calculations
- Full configurator → generated compose is valid YAML and has correct structure
- Import/export round-trip

### Test Framework
- Vitest (Bun-compatible, fast)
- Testing Library for Svelte components
- Playwright for E2E if needed

---

## 10. Open Questions for Discussion

1. **Branding/naming:** The tool needs a name. Something catchy and descriptive. "SelfHost Guide"? "HomeStack"? "ServerSense"?

2. **Monetization (if any):** Affiliate links for hardware? Donation page? Completely free? This affects whether we link to specific products.

3. **Community contributions:** Should the service catalog be community-extensible? A JSON/YAML format that people can submit PRs for? This scales better than maintaining it ourselves.

4. **Internationalization:** Support multiple languages? The question set and recommendations are English-centric right now but the tool could serve a global audience. Electricity rates already support multiple regions.

5. **Version management:** Docker image tags are `latest` in our templates. Should we pin versions and provide an update mechanism? Or let Watchtower handle it?

6. **Compose format:** Docker Compose v2 is current. Should we also support Podman Compose or Docker Swarm mode for advanced users?

7. **Chart library for results page:** Chart.js (simple, widely used), D3 (powerful, complex), or something Svelte-native like Pancake/LayerCake?
