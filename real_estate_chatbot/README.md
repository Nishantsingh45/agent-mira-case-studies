# Agent Mira — Real Estate Chatbot

Full-stack chatbot that helps users find homes by walking them through
location → budget → bedrooms, then displaying matching properties from
three merged JSON sources. Users can save favorites; saved properties
persist (MongoDB when configured, in-memory otherwise).

## Stack

- **Frontend:** Vite + React 19 + Tailwind CSS v4
- **Backend:** Node.js (24.x, ES modules) + Express 4
- **Database:** MongoDB via Mongoose (optional — falls back to in-memory)
- **NLP:** OpenAI (optional — falls back to deterministic state machine)
- **Deployment target:** Vercel (frontend) + Render (backend) + MongoDB
  Atlas (DB)

## Project layout

```
real_estate_chatbot/
├── backend/
│   ├── server.js                       Express app + Mongo connection
│   ├── data/
│   │   ├── property_basics.json        (source #1)
│   │   ├── property_characteristics.json (source #2)
│   │   └── property_images.json        (source #3)
│   ├── services/
│   │   ├── propertyService.js          Merges sources by `id`, caches in memory
│   │   └── nlpService.js               OpenAI structured-output chat parsing
│   ├── routes/
│   │   ├── properties.js               GET /api/properties (filter)
│   │   ├── saved.js                    POST/GET/DELETE /api/saved/*
│   │   └── chat.js                     GET /api/config + POST /api/chat (NLP)
│   ├── models/SavedProperty.js         Mongoose schema (unique userId+propertyId)
│   ├── .env.example
│   └── package.json
└── frontend/
    └── src/
        ├── App.jsx
        ├── api.js
        ├── userId.js                   UUID kept in localStorage
        └── components/
            ├── ChatWindow.jsx          State-machine chat (location → budget → beds → results)
            ├── PropertyCard.jsx
            └── SavedList.jsx
```

## Endpoints

| Method | Path                              | Purpose                                                          |
| ------ | --------------------------------- | ---------------------------------------------------------------- |
| GET    | `/health`                         | Liveness + Mongo + NLP status                                    |
| GET    | `/api/config`                     | Returns `{ nlpEnabled }` — frontend picks chat mode from this    |
| POST   | `/api/chat`                       | LLM turn: parse user message, return reply + criteria + results  |
| GET    | `/api/properties`                 | Filter by `location`, `maxPrice`, `minBedrooms` (state-machine)  |
| POST   | `/api/saved`                      | Save a property for a user (idempotent upsert)                   |
| GET    | `/api/saved/:userId`              | List saved properties (joined to full objects)                   |
| DELETE | `/api/saved/:userId/:propertyId`  | Unsave                                                           |

## Run locally

Two terminals.

**Terminal 1 — backend (port 4000):**

```powershell
cd real_estate_chatbot/backend
cp .env.example .env       # then edit MONGO_URI (optional)
npm install
npm run dev
```

If `MONGO_URI` is not set or unreachable, the saved-properties store
falls back to an in-memory map. This is fine for local dev but is wiped
on restart — set MONGO_URI to persist.

**Terminal 2 — frontend (port 5173):**

```powershell
cd real_estate_chatbot/frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Vite proxies `/api/*`
to Express (see [`frontend/vite.config.js`](frontend/vite.config.js)).

## Demo flow

1. Mira asks: `What city or area are you looking in?` → enter `New York`
2. `What is your maximum budget?` → `500000`
3. `Minimum bedrooms?` → `1`
4. Mira returns matching cards (expect IDs 1 and 6 from the sample data).
5. Tap the heart on any card to save it. The right-hand sidebar updates,
   and saved state survives reloads (per browser, identified by a UUID in
   `localStorage`).
6. Type anything to start a new search.

## Approach & data merging

The three JSON sources are read once at server startup and merged by
`id` into a single in-memory list of unified property objects with this
shape:

```
{ id, title, price, location, bedrooms, bathrooms, size_sqft, amenities, image_url }
```

Filtering happens in-memory on that list — the dataset is tiny (10
records), so a Mongo collection for properties would be overkill. Mongo
is used **only** for saved-property state, which is what actually needs
persistence.

The chatbot UI is a deliberate **state machine** (`location → budget →
bedrooms → results`) rather than free-form NLP. This is reliable, easy
to test, and matches the spec's core feature list. Free-form NLP via an
LLM is listed as a bonus and would slot in by replacing `advance()` in
`ChatWindow.jsx`.

## Deployment guide

Three free-tier services, one minute each.

1. **MongoDB Atlas** — create a free M0 cluster, add a DB user, allow
   network access from `0.0.0.0/0` (Render outbound IPs are not static
   on free tier), copy the connection string.
2. **Render (backend)** — connect this repo, set root directory to
   `real_estate_chatbot/backend`, start command `node server.js`. Set
   env vars:
   - `MONGO_URI` = Atlas connection string
   - `CORS_ORIGIN` = your Vercel frontend URL
3. **Vercel (frontend)** — import this repo, set root directory to
   `real_estate_chatbot/frontend`, framework preset Vite. Set env var:
   - `VITE_API_URL` = your Render backend URL (e.g.
     `https://your-app.onrender.com`)

After deploy, verify by hitting `https://<backend>/health` and confirming
`mongoConnected: true`.

## Challenges & decisions

- **Three sources, one record.** Merging in-memory by `id` was simpler
  than modeling three collections in Mongo, and the dataset is small
  enough that there's no upside to a query-time join.
- **In-memory fallback for saved properties.** A reviewer should be able
  to clone and run without spinning up Mongo first. The
  `isMongoReady()` check in `routes/saved.js` makes the missing-Mongo
  case work transparently.
- **Anonymous per-browser user.** No auth in the spec, but saved
  properties need a stable key. A UUID minted into `localStorage` on
  first load (`userId.js`) gives a per-browser identity with zero
  ceremony.
- **State-machine over LLM for v1.** Predictable, free, testable. NLP
  parsing of free-form messages is a bolt-on bonus for v2.

## NLP chat mode (OpenAI)

The chatbot has two modes; the frontend picks the right one at startup
by calling `GET /api/config`.

| Mode               | When                                  | Behavior                                                |
| ------------------ | ------------------------------------- | ------------------------------------------------------- |
| **State machine**  | `OPENAI_API_KEY` unset                | Sequential prompts: location → budget → bedrooms        |
| **NLP (OpenAI)**   | `OPENAI_API_KEY` set on the backend   | Free-form: "3 BR in NYC under 500k" parsed in one turn  |

**Setup:**

1. Get an API key at <https://platform.openai.com/api-keys>.
2. Add to `real_estate_chatbot/backend/.env`:
   ```
   OPENAI_API_KEY=sk-...
   OPENAI_MODEL=gpt-4o-mini   # optional, default
   ```
3. Restart the backend. Startup log shows `NLP chat: enabled (OpenAI)`.

**How it works:**

- Frontend posts the full message history + the criteria gathered so far
  to `POST /api/chat`.
- Backend calls OpenAI Chat Completions with `response_format:
  json_schema` (strict structured output), so the LLM is forced to
  return `{reply, criteria, ready}` matching the schema in
  [`services/nlpService.js`](backend/services/nlpService.js).
- The system prompt tells Mira to merge new criteria with existing ones
  (so previously-collected values aren't lost), parse natural numbers
  ("500k" → 500000, "studio" → 0), and emit `ready: true` only when all
  three are filled.
- When `ready: true`, the backend immediately runs `filterProperties`
  and returns the matching properties in the same response — one
  round-trip from "I want a 3 BR in NYC under 500k" to property cards.

**Cost:** with `gpt-4o-mini`, each turn is ~$0.0001. A typical
conversation is well under a cent.

## Bonus features (deferred)

- Real-time search (debounced query while typing) — straightforward to
  add by calling `searchProperties` in an `onChange` handler.
- Multi-property comparison view — already have the components; just
  needs selection state + a comparison route.
