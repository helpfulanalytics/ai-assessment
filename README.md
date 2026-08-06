# AssessAI

A self-serve AI business assessment. A client answers a scripted discovery
interview in a chat, and a written assessment is generated from the transcript —
bottlenecks, hours lost, the off-the-shelf tools that address each one, and a
four-day quick start plan. No human in the loop.

## The flow

```
/                    landing
/discovery           the interview (and the paywall, in report mode)
/success             return trip from Stripe — waits for the webhook, then hands off
/assessment/[id]     the finished report
```

```
POST /api/discovery    start a session · take one conversational turn
POST /api/checkout     open Stripe checkout at $297
POST /api/webhook      Stripe → the only thing that may unlock a session
POST /api/assessment   transcript → validated report → email
```

State lives in one Firestore document per session (`sessions/{id}`). Reports land
in `assessments/{id}`, paid orders in `orders/{stripeCheckoutId}`.

## Where the paywall sits

`PAYWALL_POSITION` selects one of two flows:

- **`report`** (default) — the interview is free, payment unlocks the generated
  report. Better conversion; you pay model costs for people who never buy.
- **`upfront`** — payment gates the interview entirely. No wasted spend, harder sell.

Each session snapshots the value at creation, so flipping the env var never
strands a client halfway through.

## The two pieces worth understanding

**`src/lib/discovery-script.ts`** — the interview as a fixed spine of seven topics.
The model never picks what comes next; per turn it decides only whether the answer
it just heard is worth one more follow-up (capped at two per topic). Coverage is
guaranteed and cost is bounded, while the conversation still follows what the
client actually says.

**`src/lib/assessment-schema.ts`** — the offer's promises as code. The 5 hrs/week
guarantee, the 3–7 tool range, the 4-day plan, and the ban on claiming more total
savings than the parts sum to are all enforced here rather than trusted to the
model. A report that violates them is regenerated once with the specific failures
fed back; if it still fails, the request errors rather than shipping a report that
breaks a promise.

## Development

```bash
npm install
cp .env.local.example .env.local   # then fill it in
npm run dev
```

```bash
npm test        # validation + intake rules
npm run lint
```

Stripe webhooks locally:

```bash
stripe listen --forward-to localhost:3000/api/webhook
```

See `AGENTS.md` before running a production build in an agent session.
