# MAZURI
STEMM Haqqathon MAZURI idea

# Community Bridge — Founder Brief

*Internal document for co-founders. Covers the product, the strategic decisions we've locked, the pitch positioning, the business model, and a build plan.*

---

## 1. One-line pitch

**Civic feedback infrastructure that embeds into a community organisation's existing website, giving members a structured, accountable way to be heard — and admins an AI-prioritised way to act.**

The mission: **strengthen bonds in underrepresented communities by creating a real two-way flow of communication between organisations and their members.**

---

## 2. The problem

Underrepresented community organisations — mosques, supplementary schools, student societies, community centres — coordinate their members through firehose tools (WhatsApp groups, Facebook groups, physical noticeboards) that have three failures:

- **No triage.** Everything is a flat stream; urgent issues drown in noise.
- **No accountability.** Feedback goes into a void; nobody can see whether anything was acted on.
- **No structure.** Suggestions, complaints, and announcements all blur together with no way to prioritise or measure.

The result: members stop bothering to raise things, admins lose touch with what the community actually wants, and trust erodes. An ignored suggestion box is worse than no suggestion box.

---

## 3. The product

A two-way feedback engine with three flows: suggestions up, announcements down, events across.

### Users (community members)

1. **Suggestions** — public posts other members can **upvote**. Crowd-prioritised: admins instantly see which ideas have real backing.
2. **Reports** — **private, admin-only**. The user self-selects a category; an **AI clusters similar reports**, flags duplicates and patterns, and surfaces them by urgency so admins get a prioritised queue instead of a flat inbox.

### Admins (the community organisation)

1. **Announcements** — LinkedIn-style posts when a suggestion is implemented or a report resolved. **This closes the loop** and proves to members that participation leads to action. (Reports can optionally be publicised once addressed.)
2. **Event proposals** — float potential events for members to vote yes/no, gauging interest before committing resources.
3. **Moderation** — admins can **flag content they deem irrelevant**, keeping the public feed clean without heavy tooling.

### The flywheel

> Members raise suggestions & reports → AI prioritises → admins act → announcements show action was taken → trust grows → more participation → repeat.

This loop *is* the product. Everything else serves it.

---

## 4. Locked design decisions

| Area | Decision |
|---|---|
| **Identity / trust** | Users have **login accounts** → vote integrity (one account, one vote) and report credibility (tied to a real member, not anonymous noise). |
| **AI role** | User picks the category (the trivial part); **AI does the clustering/duplicate-detection** across many reports (the part a dropdown can't do). AI is load-bearing, not decorative. |
| **Urgency ladder** | Reports prioritised: **Safety > Facilities > General feedback.** Consistent and explainable. |
| **Moderation** | Admin-driven flagging of irrelevant content. Login enables tracing / rate-limiting bad actors if needed. |
| **Distribution** | **Embed into the org's existing website** (standalone site as fallback). Solves cold-start — we go where the community already is. |
| **Scope boundary** | We are a **communication & feedback layer, not a safeguarding or emergency service.** Serious safety reports are routed to admins and signposted, never handled as a 999 replacement. |
| **Admin engagement** | We assume an admin who opts in is motivated to act. Soft backstop: the public suggestion feed creates visible accountability. |

---

## 5. Why we're different (say this out loud in the pitch)

Every one of these communities already coordinates *somewhere*. Our edge over WhatsApp / Facebook groups / noticeboards:

- **Structure** — suggestions, reports, events and announcements are separate, typed flows, not one stream.
- **Triage** — AI clustering + an urgency ladder turn noise into a prioritised queue.
- **Accountability** — the announcement loop creates a visible record that feedback led to action.
- **Distribution** — we embed into the website the community already runs, so there's nothing new to download or migrate to.

Reframe for ambition: this isn't a "feedback app," it's **civic infrastructure for communities that institutions overlook.**

---

## 6. Business model

**Free core tier** — suggestions, reports (plain list, no AI), announcements, voting. This is the **adoption wedge**: free to embed, zero barrier to the first install, the network grows here.

**"Insights" tier — £29/month per org** — unlocks the real value: AI clustering + duplicate detection, urgency triage, and accountability analytics. This is the tier that locks on non-payment.

**Network tier — £19/org/month for 10+ orgs** (or a negotiated flat rate for an umbrella body, e.g. a mosque network, diocese, or students' union). **This is where the real money is** — one sale deploys to many orgs, slashing acquisition cost.

**Non-payment:** paid features lock and historical data goes **read-only / archived — never deleted** — restored on resubscription. (Keeps commercial pressure without the optics of deleting a vulnerable community's data.)

**Margin line for judges:**
> "At £29/month against roughly £4 of marginal cost, we run ~85% gross margin — standard healthy SaaS. The free tier drives adoption through websites communities already run; we monetise the AI layer that turns feedback into action."

---

## 7. Proposed technical architecture

*(Starting point for discussion — not locked. Stack assumes web-first, embeddable.)*

```
┌─────────────────────────────────────────────────────────┐
│  EMBED LAYER                                             │
│  Embeddable widget (iframe / JS snippet) dropped into    │
│  the org's existing site. Standalone hosted page as      │
│  fallback for orgs with no website.                      │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  FRONTEND                                                │
│  Member view: suggestion feed, upvote, report form,      │
│    event voting.                                         │
│  Admin dashboard: prioritised report queue, clusters,    │
│    announcements composer, event creator, flagging.      │
└───────────────────────────┬─────────────────────────────┘
                            │  REST / API
┌───────────────────────────▼─────────────────────────────┐
│  BACKEND / API                                           │
│  Auth (login, roles: member vs admin)                    │
│  Suggestions, votes, reports, events, announcements      │
│  Subscription / billing state, feature gating            │
│  Moderation / flagging                                   │
└──────────────┬────────────────────────────┬─────────────┘
               │                            │
┌──────────────▼───────────┐   ┌────────────▼─────────────┐
│  DATABASE (multi-tenant) │   │  AI SERVICE              │
│  Orgs, users, posts,     │   │  Embed reports → cluster  │
│  votes, reports, events  │   │  duplicate detection      │
│  Tenant isolation by org │   │  urgency scoring/summary  │
└──────────────────────────┘   └──────────────────────────┘
```

**Notes**
- **Multi-tenant** from day one — every record scoped to an org. This is what makes the network tier cheap to serve.
- **AI service** is the clustering engine: embed each report into a vector, group near-duplicates, flag patterns, attach the urgency rank. Cheap per call (fractions of a penny to embed, pennies for occasional summaries).
- **Feature gating** on subscription state is core, not an afterthought — the free/Insights split lives here.
- Stack suggestion (open for debate): React frontend, a Node or Python backend, Postgres (with pgvector for clustering, avoids a separate vector DB), hosted on something cheap and scalable. We're Imperial CE/EE — pick what the team can move fastest in.

---

## 8. Build plan (suggested phases)

**Phase 0 — Foundations**
- Auth + roles (member / admin), org/tenant model, schema.

**Phase 1 — Free core (the wedge)**
- Suggestion feed + upvotes
- Report form with category selection (plain list for admin, no AI yet)
- Announcements composer + public feed
- Event proposals + voting
- Admin flagging
- Embeddable widget

**Phase 2 — Insights tier (the AI + the money)**
- Report clustering + duplicate detection
- Urgency scoring on the Safety > Facilities > General ladder
- Accountability analytics ("% addressed in 30 days")
- Subscription / billing + feature gating
- Read-only/archive on non-payment

**Phase 3 — Pitch polish**
- One seeded demo org with realistic data
- The 30-second demo loop (see §10)
- Network-tier onboarding flow (even if mocked)

---

## 9. Open items / still to decide

- **Accountability metric** — strongly recommend adding a public **"% of suggestions addressed within 30 days"** per org. Makes trust measurable, nudges admins to act, and doubles as our north-star retention metric. Cheap to build, disproportionately impressive.
- **Embed integration story** — nail a one-liner: "drop in one snippet, live in minutes," so it doesn't sound like a dev project.
- **Pricing validation** — £29 / £19 are defensible guesses; worth sanity-checking against what charities already pay for mailing/scheduling tools.
- **First design partner** — which specific mosque / society do we pilot with? A named first customer makes the whole pitch concrete.

---

## 10. Pitch assets to prepare

**Structure:** Problem (with a real story) → Solution → the embed wedge → live demo loop → why now → business model → the ask.

**The demo loop (memorise this — judges remember demos, not slides):**
> A report comes in → AI clusters it with 14 others about the same broken heating and ranks it urgent above three lesser items → admin taps resolve and posts an announcement → it appears in the public feed → "% addressed" ticks up. The whole loop in 30 seconds.

**Pre-empt these objections inside the pitch (answering before they're asked reads as maturity):**
- *"Why not WhatsApp?"* → no triage, no accountability, no record of resolution.
- *"Why does this need AI?"* → the user picks the category; the AI finds the patterns across hundreds of reports that a human admin would miss. A dropdown can't cluster.
- *"How do you get the first users?"* → we embed into the website they already run; the audience is already there.

**"Why now":** community fragmentation and declining institutional trust are rising; AI clustering is suddenly cheap enough to make small-community feedback viable; and these orgs are web-present now in a way they weren't a decade ago.

---

## 11. Honest assessment (where we stand)

The bones are strong: the public/private two-tier split is a real insight, the closed loop is a genuine flywheel, and the embed-first distribution quietly solves the cold-start problem that kills most community apps. The AI is now load-bearing (clustering, not a glorified dropdown). The model has margin.

Remaining risk is mostly **execution and storytelling**, not concept: make the AI's value visible in the demo, name a first design partner, add the accountability metric, and rehearse the objection pre-empts. Do those and this pitches like a top-tier idea.

---

## 12. Current progress & roadmap

*Snapshot as of July 2026. Legend: ✅ done · 🟡 partial · ⬜ not started.*

### What's built

**Backend** — Node + Express + TypeScript, raw SQL on `pg`, JWT bearer auth. The **free core tier is feature-complete** and the **Insights tier (AI clustering, accountability analytics, feature gating) is implemented.**

- ✅ **Auth / users sign in** — email + password signup and login, bcrypt password hashing, JWT bearer tokens, `/api/auth/me`.
- ✅ **Communities & multi-tenancy** — create a community (join code + join password), join by code, list "my communities", per-community roles (admin / member), promote member → admin.
- ✅ **Suggestions** — post, list, one-vote-per-user upvotes, admin moderation (approve / reject).
- ✅ **Incident reports** — private, admin-only, severity RED / AMBER / GREEN, resolve.
- ✅ **Announcements (the news feed)** — admins post, members read.
- ✅ **Posts** — LinkedIn-style community posts.
- ✅ **Events** — proposals with 1–5 member ratings.
- ✅ **Leaderboard** — weighted cross-community ranking (resolved-ratio, events, rating, activity).
- ✅ **AI clustering + urgency triage (Insights tier)** — `clusterReports` groups a community's open reports into clusters of near-duplicates and ranks them on the Safety > Facilities > General ladder, via one structured-output call to the Anthropic Messages API (`claude-opus-4-8`, key in `AI_API_KEY`). Exposed at `GET …/incidents/clusters` (admin, Insights-gated). *pgvector stays provisioned for a future embeddings pipeline; at community scale a single LLM call clusters more accurately with no separate vector store.*
- ✅ **Accountability analytics** — `GET …/analytics` computes the public "% of reports addressed within 30 days" metric (plus counts); surfaced in the community header.
- ✅ **Subscription / feature gating** — per-community `tier` (`free` / `insights`); AI triage returns 402 on the free tier; `POST …/subscription` (admin) flips the tier. **Billing itself is mocked** — a payment provider slots in front of the gate later. Downgrading locks features, never deletes data.
- ✅ **Seeded demo org** — `npm run db:seed` creates East London Mosque with realistic data: suggestions with votes, a moderation queue, three near-duplicate heating reports (the AI clustering demo), a resolved report inside the 30-day window, events, announcements. See §13 for the accounts.

**Frontend** — React + TypeScript (Vite), standalone-first and embed-ready. **Fully wired to the backend API — the prototype seed data is gone.**

- ✅ **Landing page.**
- ✅ **Auth** — sign-up / sign-in call `/api/auth`, the JWT is stored (localStorage) and attached to the API client, and the session is restored on reload via `/api/auth/me`.
- ✅ **My Communities** — live list, create community, join by code + password, and the cross-community leaderboard.
- ✅ **Community view** — live tabbed member/admin workspace: suggestion feed + one-vote upvotes, private report composer (severity RED/AMBER/GREEN), events with 1–5 ratings on past events, a merged Updates feed (announcements + posts), admin moderation queue (approve/reject), report queue with resolve, **AI triage panel** (clusters + urgency, with an in-app Insights upgrade when on free tier), and member management (promote to admin). The real membership role gates the admin view.
- ✅ **Embeddable widget** — `src/embed/` mounts the same `CoreApp` into any host element; `npm run build:embed` produces a self-contained `community-bridge.js` + `.css` (drop-in snippet in `src/embed/index.ts`).
- ✅ **Deploy config** — Netlify (`netlify.toml`).

> **Decided:** general **community posts** and **announcements** stay admin-only (the "announcements down" flow); ordinary members contribute by posting **suggestions** (public, upvotable) and **incident reports** (private to admins). We are not opening a free-form member post feed.

### To-do / roadmap

- ⬜ **Real billing** — Stripe (or similar) in front of the existing tier gate; needs a provider decision + keys. The gate, lock behaviour and upgrade UX already exist.
- ⬜ **Embeddings pipeline (pgvector)** — swap the single-call LLM clustering for embed-and-cluster once report volume outgrows one context window; the extension is already enabled.
- ⬜ **Announcement linking** — connect an announcement to the suggestion/report it resolves so the accountability loop shows in the feed; plus edit / delete / pin.
- ⬜ **Network-tier onboarding flow** (can stay mocked for the pitch).

---

## 13. Local development

> The **free core tier and the Insights tier are implemented and run end-to-end** — auth, communities, suggestions, reports, announcements, events, leaderboard, AI clustering + urgency triage, accountability analytics, and tier gating (billing mocked; see §12). Everything compiles and runs clean.

### Stack

| Layer | Tech |
|---|---|
| Backend | Node.js + Express + TypeScript |
| Frontend | React + TypeScript (Vite) |
| Database | PostgreSQL + pgvector (for report clustering later) |
| Orchestration | Docker Compose |

### Run everything with Docker (recommended)

```sh
copy .env.example .env       :: Windows (cmd)  — or:  cp .env.example .env
docker compose up --build
```

This brings up three services:

- **postgres** — Postgres 16 with the `pgvector` extension enabled on first boot (`docker/postgres/init.sql`).
- **backend** — Express API at <http://localhost:4000> (health check: <http://localhost:4000/health> → `{ "status": "ok" }`).
- **frontend** — Vite dev server at <http://localhost:5173>.

Ports and credentials are all driven by `.env` (see `.env.example` for every variable, with comments). To enable AI report clustering, set `AI_API_KEY` to an Anthropic API key (<https://console.anthropic.com/settings/keys>); everything else works without it.

### Seed the demo org

```sh
cd backend && npm run db:seed     :: point DATABASE_URL at localhost when outside Docker
```

Creates **East London Mosque** (join code `ELM2026`, join password `welcome1`, Insights tier) with realistic data for the 30-second demo loop. Accounts (password `password123` for all): `imam@demo.local` (admin), `amina@demo.local`, `yusuf@demo.local`, `fatima@demo.local`.

### Build the embeddable widget

```sh
cd frontend && npm run build:embed    :: emits dist-embed/community-bridge.{js,css}
```

Drop-in snippet for a host site (the host's origin must be in `CORS_ALLOWED_ORIGINS`):

```html
<link rel="stylesheet" href="/path/to/community-bridge.css">
<div data-community-bridge data-api-base-url="https://api.your-deployment.example"></div>
<script src="/path/to/community-bridge.js"></script>
```

### Run a service directly (without Docker)

```sh
cd backend && npm install && npm run dev      :: API on http://localhost:4000
cd frontend && npm install && npm run dev     :: web on http://localhost:5173
```

When running the backend directly, point `DATABASE_URL` at `localhost` instead of the `postgres` service name.

### Project layout

```text
backend/    Express + TS API (config, routes, controllers, services, middleware, models)
frontend/   React + TS (Vite) — standalone-first, embed-ready (see §13)
docker/     supporting docker config (postgres pgvector init)
```

---

## 14. Frontend architecture — standalone-first, embed-ready

**Open decision (A vs B), kept open by design:** the frontend may ultimately ship as **(A) an embeddable widget** other communities drop into their existing sites, or **(B) our own standalone website**. See the Distribution row in §4 and the embed layer in §7 — this is not yet locked.

We are **building the standalone web app first** (simpler), but the code is structured so the embed becomes an *added wrapper, not a rewrite*:

- **`frontend/src/core/`** — the self-contained core app. It mounts into whatever container it's handed and styles **only its own subtree** (scoped `cb-` CSS, no `html`/`body`/global styling), so it makes no assumption that it owns the page. This is what runs in *both* modes.
- **`frontend/src/standalone/`** — the standalone entry (path **B**). Mounts `core` as a full hosted page. `src/main.tsx` boots this today.
- **`frontend/src/embed/`** — the widget shell (path **A**). Mounts the *same* `CoreApp` inside any host element (auto-mounts `[data-community-bridge]`), built as a self-contained IIFE via `npm run build:embed` — `core` and `standalone` were untouched, exactly as designed.
- **`frontend/src/api/`** — a **token-based** API client with a **configurable base URL**, so the same client works on our own page or on a third-party domain.

**Backend is built embed-ready from day one:** auth is **JWT bearer tokens (not session cookies**, which break inside third-party embeds), and **CORS is configurable** via `CORS_ALLOWED_ORIGINS`. If we go the embed route, each host community's domain gets added there (or it becomes a per-org allowlist).
