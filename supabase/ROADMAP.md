# ROADMAP — TripPlanner (Trip Pilot)

This roadmap is designed to be **commit-driven**, **Codex-friendly**, and focused on shipping vertical slices that steadily move TripPlanner toward the goal:

> **The best trip planning app in the world** — the place your group goes so nobody has to text for basics, the organizer isn’t a bottleneck, and the plan survives chaos (offline + notifications + integrations).

---

## Current status (baseline)

As of the current deployed state, the app has:

- [x] Auth (signup/login/logout) + protected routes
- [x] Trips: dashboard list + create-trip wizard + trip detail page
- [x] Categories per trip
- [x] Category detail with Tasks: CRUD, status, due date, complete, delete
- [x] Assignees + member dropdown (via `profiles` + `trip_members`)
- [x] Vercel deploy pipeline + Supabase backend working

If any of these drift, update this section first.

---

## Guiding principles

1. **Vertical slices > big rewrites**  
   Ship a usable end-to-end loop, then expand.

2. **Collaboration is the core**  
   The app must reduce organizer load and make contributors effective.

3. **Offline + right-time nudges is the moat**  
   Airports, bad cell service, and last-minute changes are the real enemy.

4. **AI assists, never fights the user**  
   AI drafts, explains, and adapts; user stays in control.

5. **Predictable data + security always**  
   Schema drift and lax RLS will kill trust. Keep them tight and documented.

---

## Commit conventions

Use small, reviewable commits. Prefer this pattern:

- `feat(trips): ...`
- `feat(tasks): ...`
- `feat(itinerary): ...`
- `feat(people): ...`
- `chore(db): ...`
- `chore(ci): ...`
- `fix(rls): ...`
- `refactor(data): ...`

Each commit should include:
- Clear UI behavior (what user can do)
- DB/migration changes (if any) under `/supabase/migrations`
- RLS updates (if any)
- Local build passes (`npm run build`)

---

## Definitions of Done (DoD)

A milestone is “done” when:
- ✅ The user flow works on production (Vercel)
- ✅ RLS rules are correct and tested with at least 2 users (owner + member)
- ✅ Empty/loading/error states exist (not raw crashes)
- ✅ The UI matches the design system (spacing, typography, components)
- ✅ No schema drift: migrations reflect production state

---

# Milestones and commit plans

## Milestone 0 — Foundation hardening
Goal: remove ambiguity and make future development faster.

- [ ] chore(db): introduce migrations folder + single source-of-truth schema
- [ ] fix(db): normalize categories icon column (choose `icon` as canonical)
- [ ] refactor(data): create data helpers for trips/categories/tasks/profiles
- [ ] fix(routes): enforce category fetch scoped to trip (categoryId + tripId)
- [ ] feat(ui): global toast system (success/error) + consistent error states
- [ ] chore(ci): add GitHub Actions build + typecheck + lint
- [ ] chore(ui): remove console noise + polish loading skeletons

**DoD check:** new dev can clone repo, run migrations, and everything matches prod.

---

## Milestone 1 — Planning MVP polish (Tasks + Categories feel complete)
Goal: tasks become genuinely useful with volume and collaboration.

- [ ] feat(tasks): filters (All / Open / Done / Mine)
- [ ] feat(tasks): sorting controls (due date / status / manual)
- [ ] feat(tasks): quick-add UX (keyboard-first, auto-focus, fast editing)
- [ ] feat(tasks): comments v1 (simple thread per task)
- [ ] feat(tasks): activity feed v1 (who changed what)
- [ ] feat(categories): progress indicators (open/done counts + percent)
- [ ] feat(categories): reorder categories (drag/drop, persist display_order)
- [ ] feat(trip): make Quick Actions real (add task, add note, add link)

**DoD check:** user can manage 50+ tasks without chaos.

---

## Milestone 2 — People & invitations (real collaboration)
Goal: invite flow, roles, onboarding, and permissions are rock solid.

- [ ] feat(people): People page scaffold `/trips/[id]/people`
- [ ] feat(people): list members with roles + joined date + avatars (optional)
- [ ] feat(invites): show pending invites (email + status + created_at)
- [ ] feat(invites): create invite tokens + send email (Resend recommended)
- [ ] feat(invites): accept invite flow (magic link / token join page)
- [ ] feat(roles): owner/member role changes with guardrails
- [ ] feat(roles): transfer ownership (single flow, confirm modal)
- [ ] feat(people): remove member (owner only) + safe confirmations
- [ ] fix(rls): consolidate membership-based RLS using helper function(s)

**DoD check:** two users can join the same trip, collaborate, and permissions behave.

---

## Milestone 3 — Itinerary v1 (day-by-day schedule)
Goal: the trip becomes a time-based plan that survives changes.

- [ ] chore(db): itinerary tables + RLS (`itinerary_days`, `itinerary_items`)
- [ ] feat(itinerary): scaffold `/trips/[id]/itinerary`
- [ ] feat(itinerary): auto-generate days from trip dates
- [ ] feat(itinerary): add itinerary item (title, time optional, location optional, notes)
- [ ] feat(itinerary): reorder within day (drag/drop, sort_order)
- [ ] feat(itinerary): move items between days
- [ ] feat(itinerary): arrival/departure markers (“travel day” support)
- [ ] feat(linking): convert task → itinerary item (and link back)
- [ ] feat(itinerary): print/share read-only itinerary view

**DoD check:** one person can plan, others can follow without asking questions.

---

## Milestone 4 — Packing lists (don’t-forget coordination)
Goal: shared packing that prevents duplicates and missed essentials.

- [ ] chore(db): packing tables + RLS (`packing_categories`, `packing_items`)
- [ ] feat(packing): packing page `/trips/[id]/packing`
- [ ] feat(packing): claim item + packed toggle
- [ ] feat(packing): templates by trip type (seed suggestions)
- [ ] feat(packing): personal vs shared lists
- [ ] feat(packing): summary widgets (Needed / Mine / Claimed)

**DoD check:** family trip packing works without text threads.

---

## Milestone 5 — Documents & confirmations (single source of truth)
Goal: store and retrieve “the important stuff” fast.

- [ ] chore(storage): Supabase storage bucket + policies
- [ ] feat(docs): documents page `/trips/[id]/docs`
- [ ] feat(docs): upload + list + preview (images, PDFs)
- [ ] feat(docs): tags by category + search
- [ ] feat(docs): manual extracted fields v1 (confirmation #, phone, address)
- [ ] feat(linking): attach docs to itinerary items/tasks
- [ ] feat(pwa): offline cache for critical docs metadata

**DoD check:** you can find Airbnb address, tickets, confirmations in seconds.

---

## Milestone 6 — Maps & location intelligence
Goal: trip becomes spatial—pins, routes, and context.

- [ ] chore(db): normalize location fields (place_name, address, lat/lng)
- [ ] feat(map): map view v1 (pins for itinerary + lodging)
- [ ] feat(map): open directions in Google/Apple Maps
- [ ] feat(map): filters (by day/category)
- [ ] feat(map): distance/time estimates (basic API integration)

**DoD check:** users stop asking “where is this relative to that?”

---

## Milestone 7 — Weather
Goal: proactive context that changes what you pack and plan.

- [ ] feat(weather): weather service integration (destination + dates)
- [ ] feat(weather): trip header widget + daily overview
- [ ] feat(weather): packing nudges (rain gear, layers)
- [ ] feat(weather): itinerary warnings (storms, heat risk windows)

**DoD check:** weather impacts decisions without being annoying.

---

## Milestone 8 — Notifications (the app gets proactive)
Goal: right-time nudges, not noise.

- [ ] chore(db): notifications table + preferences
- [ ] feat(notifications): in-app notification center
- [ ] feat(notifications): email notifications (invites, assignments)
- [ ] feat(notifications): due-date reminders
- [ ] feat(notifications): trip countdown reminders
- [ ] feat(pwa): push notifications (PWA)
- [ ] feat(notifications): quiet hours + per-trip settings

**DoD check:** users feel “supported,” not spammed.

---

## Milestone 9 — Offline-first PWA polish
Goal: feels native and works in airports / poor service.

- [ ] feat(pwa): manifest + icons
- [ ] feat(pwa): service worker + offline shell
- [ ] feat(pwa): cache trip essentials (itinerary, tasks, docs metadata)
- [ ] feat(sync): offline mutation queue + background sync
- [ ] feat(pwa): install UX + education
- [ ] perf: route loading + bundle optimizations

**DoD check:** essential trip info is usable without internet.

---

## Milestone 10 — Budget + splitting (optional but powerful)
Goal: shared expenses and “who owes who” clarity.

- [ ] chore(db): expenses schema + RLS
- [ ] feat(budget): add expense (amount, category, payer, split)
- [ ] feat(budget): balances (who owes who)
- [ ] feat(budget): settle-up suggestions
- [ ] feat(budget): export CSV

**DoD check:** group can settle without spreadsheets/texts.

---

## Milestone 11 — Chat (only if it adds value)
Goal: reduce context switching without becoming noise.

- [ ] chore(db): trip chat schema + RLS
- [ ] feat(chat): chat UI + realtime
- [ ] feat(chat): pin messages (codes, addresses)
- [ ] feat(chat): convert message → task/itinerary item
- [ ] feat(chat): search chat

**DoD check:** chat is a tool, not a distraction.

---

## Milestone 12 — AI Trip Copilot (best-in-world differentiator)
Goal: help users plan faster with explainable drafts.

- [ ] feat(ai): context builder (trip + prefs + constraints)
- [ ] feat(ai): generate itinerary draft (editable + explainable)
- [ ] feat(ai): recommend activities/restaurants with rationale
- [ ] feat(ai): optimize day grouping (route-aware)
- [ ] feat(ai): packing suggestions (itinerary + weather)
- [ ] feat(ai): conflict detection (timing, closed hours, travel time)
- [ ] feat(ai): ask-about-my-trip chat grounded in trip data
- [ ] chore(ai): guardrails + source attribution where appropriate

**DoD check:** AI makes planning faster without reducing control.

---

## Milestone 13 — Templates & trip types
Goal: instant “starter kits” for common trip patterns.

- [ ] feat(trips): trip type selection during creation
- [ ] feat(templates): default templates per type
- [ ] feat(templates): save trip as template
- [ ] feat(templates): clone trip
- [ ] feat(sharing): read-only public share link (optional)

**DoD check:** creating a tournament/work trip is 60 seconds.

---

## Milestone 14 — Delight & trust (this is what makes it #1)
Goal: the finishing moves that separate “good” from “best”.

- [ ] feat(nav): global search across trips/tasks/itinerary/docs
- [ ] feat(nav): command palette (jump anywhere fast)
- [ ] feat(ui): smart empty states that guide next actions
- [ ] a11y: accessibility pass (keyboard, aria, contrast)
- [ ] obs: analytics + event tracking (what users actually use)
- [ ] obs: error tracking + performance monitoring (Sentry or equivalent)
- [ ] feat(onboarding): new-trip checklist + tips for owners
- [ ] biz: pricing/subscriptions (only if monetizing)

**DoD check:** users feel “this was made for me.”

---

## Recommended execution order (high impact)
If you want maximum user value quickly:

1) Milestone 0 (hardening)
2) Milestone 2 (People & invitations)
3) Milestone 3 (Itinerary v1)
4) Milestone 9 + 8 (PWA + Notifications)
5) Milestones 4/5/6/7 (Packing, Docs, Maps, Weather)
6) Milestone 12 (AI Copilot)
7) Milestones 10/11/13/14 as polish & scale

---

## Roadmap maintenance
After each deployed milestone:
- Add a short “Release Notes” section below with date + highlights.
- Mark completed commits.
- If you change schema/RLS, update the “single source of truth” migration set.

---

## Release notes
_TODO: add entries here as milestones ship._