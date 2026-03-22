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
/about                      → About the project, contribute, etc.
```

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
│   ├── Tooltip.svelte            # Contextual help
│   └── ConditionalSection.svelte # Show/hide based on condition (animated)
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
└── shared/
    ├── RunningTotal.svelte        # Floating/sticky cost total
    ├── ProgressBar.svelte         # Wizard progress indicator
    ├── Badge.svelte               # Skill level badge
    ├── Alert.svelte               # Warning/info messages
    └── CodeBlock.svelte           # Syntax-highlighted code display
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
       + ($a.vpnService?.cost ?? 0);
});

export const estimatedStorage = derived(assessment, ($a) => {
  return calculateStorage($a);
});

export const recommendation = derived(
  [assessment, totalMonthlySaaS, estimatedStorage],
  ([$a, $saas, $storage]) => {
    return generateRecommendation($a, $saas, $storage);
  }
);
```

**LocalStorage persistence:**

```typescript
// src/lib/stores/persist.ts
import { assessment } from './assessment';

// Save on every change
assessment.subscribe(value => {
  localStorage.setItem('selfhost-assessment', JSON.stringify(value));
});

// Restore on load
const saved = localStorage.getItem('selfhost-assessment');
if (saved) {
  assessment.set(JSON.parse(saved));
}
```

**Export/import** for sharing or backup:

```typescript
export function exportState() {
  return JSON.stringify({
    version: 1,
    assessment: get(assessment),
    configuration: get(configuration),
    timestamp: Date.now(),
  });
}

export function importState(json: string) {
  const data = JSON.parse(json);
  if (data.version === 1) {
    assessment.set(data.assessment);
    configuration.set(data.configuration);
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
├── +page.svelte           → Landing (tiny)
├── assess/
│   ├── +page.svelte       → Wizard (core bundle)
│   └── results/
│       └── +page.svelte   → Results (includes chart library, lazy loaded)
├── configure/
│   ├── +page.svelte       → Configurator (lazy loaded)
│   └── review/
│       └── +page.svelte   → Review + compose generation (lazy loaded, includes YAML lib)
└── setup/
    └── +page.svelte       → Guided setup (lazy loaded, future)
```

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
  otherServices: string[];
  
  // Screen 3
  mediaAcquisition: 'physical' | 'digital' | 'existing' | 'other' | null;
  videoQuality: '1080p' | '4k' | '4k_hdr' | null;
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
  existingPhotoLibrary: number; // GB
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
}

interface ServiceCost {
  id: string;
  name: string;
  cost: number; // monthly
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
