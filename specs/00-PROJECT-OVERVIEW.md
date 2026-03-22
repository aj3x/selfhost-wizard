# SelfHost Guide — Project Overview

## What This Is

A client-side web application that takes someone from "should I even self-host?" through to a running, configured server stack. It is opinionated, adaptive to user skill level, and generates real docker-compose files with initial service configuration.

## The Three Phases

### Phase 1 — Assessment ("Is it worth it?")

A guided wizard that collects information about a user's current spending, habits, and needs, then produces a personalized cost/benefit analysis. This includes hardware cost estimates, electricity projections, hard drive failure risk modeling, and a comparison to both their current SaaS spending and cloud-hosted alternatives.

**This is the MVP and ships first.** It's shareable, low-commitment, and proves the concept.

### Phase 2 — Configurator ("What do I need?")

Translates assessment answers into a concrete service stack and hardware recommendation. Generates a docker-compose file with proper networking, volumes, VPN routing via Gluetun, and reverse proxy configuration. Similar in spirit to setupmc.com/java-server/ but for a full home server stack.

### Phase 3 — Guided Setup ("Make it work")

Post-deployment wizard that walks through initial configuration of each service using their APIs — connecting Sonarr to Prowlarr, setting up quality profiles, configuring download clients, etc. This is where most people abandon self-hosting, so it's the highest-value piece long-term.

---

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Runtime | Bun | Native SQLite (if needed later), fast, good TS support |
| Frontend | SvelteKit | Performant, light, excellent for form-heavy interactive UIs with lots of conditional logic. Svelte's reactivity model is clean for wizard flows. |
| Styling | TBD | Tailwind, vanilla CSS, or component library — to be decided in design phase |
| State | Client-side only | All calculations and generation happen in-browser. No backend for Phase 1-2. |
| Persistence | localStorage + JSON export/import | No accounts, no database. User owns their data. |
| Deployment | Static SPA | Vercel, Netlify, or Cloudflare Pages. No server required for Phase 1-2. |

## Architecture Principles

1. **Client-side first.** No backend until Phase 3 absolutely requires it (and even then, consider if the user can run a local script instead).
2. **Opinionated by skill level.** The first question determines how much choice the user gets. Beginners get curated recommendations. Advanced users get full control.
3. **Composable service registry.** Each supported service is a module declaring its compose fragment, dependencies, conflicts, networks, and volumes. The generator assembles these.
4. **Progressive disclosure.** Never overwhelm. Show what's relevant based on prior answers. Advanced options exist but are tucked away for beginners.

## Shipping Plan

| Milestone | Contents | Goal |
|-----------|----------|------|
| **v0.1** | Phase 1 assessment wizard + cost calculator | Shareable tool, prove the concept, collect feedback |
| **v0.2** | Phase 2 configurator — service selection + compose generation | Users get a working docker-compose.yml |
| **v0.3** | Phase 2 additions — VPN config, reverse proxy, hardware recs | Complete pre-deployment experience |
| **v1.0** | Phase 3 guided setup wizard | Full end-to-end experience |

---

## File Index

| Document | Contents |
|----------|----------|
| `01-ASSESSMENT-WIZARD.md` | Every question, its purpose, conditional logic, and how answers feed calculations |
| `02-COST-MODEL.md` | Formulas for TCO, break-even, electricity, storage, drive failure, risk factors |
| `03-SERVICE-CATALOG.md` | Every supported service, its compose fragment, dependencies, and configuration |
| `04-CONFIGURATOR-FLOW.md` | How the configurator works — selection logic, dependency resolution, compose generation |
| `05-HARDWARE-RECS.md` | Storage calculations, device tiers, pre-built NAS considerations, JBOD/existing hardware |
| `06-VPN-CONFIG.md` | Gluetun setup for each supported provider, routing rules, what goes through VPN and what doesn't |
| `07-GUIDED-SETUP.md` | Phase 3 — post-deployment API-based configuration for each service |
| `08-DESIGN-DECISIONS.md` | UI/UX patterns, component structure, state management approach, responsive design |
