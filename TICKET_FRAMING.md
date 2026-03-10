# Ticket framing: nurses free, presale & door-only

Use this model everywhere (event details, FAQ, forms, emails) so messaging is consistent.

## Rules

1. **Verified nurses**  
   - Always get **free** admission (no purchase).  
   - Copy: “Claim your free ticket” / “Get your free ticket” — not “purchase” or “buy.”

2. **We are not selling tickets for every event**  
   - Some events have no online sales; ticket availability is per event.

3. **Per-event ticket availability**  
   - **Presale:** Some venues offer presale tickets (advance purchase, often online). For those events, show that presale is available (e.g. “Presale tickets available”) and keep nurse copy as “Claim your free ticket.”  
   - **Door only:** Some events are “tickets at the door only” (no advance online purchase). For those, show “Tickets available at the door only” and “Verified nurses: free admission at the door with ID” (or claim at door).

## Suggested copy by context

| Context | Suggested copy |
|--------|-----------------|
| Verified nurse, any event | “Claim your free ticket” / “Get your free ticket” |
| Unverified / not logged in | “Register and verify your nursing license to get free tickets.” |
| Event has presale | “Presale tickets available. Verified nurses: claim your free ticket above.” |
| Event door-only | “Tickets at the door only. Verified nurses: free admission at the door with ID.” |
| Event details TBA | “Ticket details coming soon. Verified nurses always receive free admission.” |
| FAQ / general | “Nursing Rocks concerts are free for verified nurses. Some venues offer presale tickets for guests; others are admission at the door only. Check each event for details.” |

## Event fields (schema)

Use these when building event details so the right message shows per event:

- **`has_presale_tickets`** (boolean) – Presale (advance) tickets are available for this event.
- **`tickets_at_door_only`** (boolean) – Tickets are only available at the door (no online presale).

Logic:

- If `tickets_at_door_only` → show “Tickets at the door only” and nurse line about free at door.
- Else if `has_presale_tickets` → show “Presale tickets available” and nurse “Claim your free ticket.”
- Else → “Ticket details TBA” or “Verified nurses: claim your free ticket when available.”

Nurses never pay; presale/door-only only affect how *other* guests get tickets and what we say on the page.

## Schema and deploy

The `events` table has two optional columns: `has_presale_tickets`, `tickets_at_door_only`. After pulling schema changes, run `npm run db:push` so existing databases get these columns (optional; they default to false).
