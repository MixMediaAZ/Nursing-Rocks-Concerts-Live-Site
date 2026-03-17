# FLOWCHART: Event Registration + Ticketing
## Generic template — free or paid tickets, single or multi-event

---

## STANDARD BUILD ORDER

```
[1]  fix-ts-errors              ← if TypeScript errors exist
      ↓
[2]  security-rate-limit
      ↓
[3]  auth                       ← user registration + login
      ↓
[4]  db                         ← events, tickets, users tables
      ↓
[5]  email                      ← Resend
      ↓
[6]  ticket-allocation          ← free OR paid branch below
      ↓
[7]  qr-generate                ← ticket QR codes
      ↓
[8]  email-confirmation         ← sends ticket + QR on registration
      ↓
[9]  user-dashboard             ← ticket display + QR
      ↓
[10] admin-dashboard            ← attendee list + check-in
      ↓
[11] email-sequences            ← reminders (1 week, 1 day, day-of)
      ↓
[12] checkin-management         ← QR scan at door
      ↓
[13] deploy
```

---

## BRANCH CONDITIONS

### Ticket Type Branch
```
IF tickets == free
  → ticket-allocation-free node
  → no payments node required
  → confirmation email triggers on registration

IF tickets == paid
  → insert payments-stripe after auth
  → ticket-allocation-paid node
  → confirmation email triggers on payment_intent.succeeded webhook
```

### Capacity Branch
```
IF capacity_limit exists
  → ticket-allocation checks capacity before issuing
  → waitlist node if at capacity
  → waitlist confirmation email variant

IF no capacity limit
  → standard allocation flow
```

### Multi-Event Branch
```
IF multiple events
  → events table with city/date/capacity per event
  → registration tied to specific event_id
  → confirmation email uses dynamic event details

IF single event
  → event details hardcoded in confirmation template
```

---

## ACTOR MAP

```
ATTENDEE
  → registers account
  → selects event (if multi-event)
  → receives confirmation email with QR ticket
  → views ticket in dashboard
  → presents QR at door

ADMIN
  → views attendee list per event
  → manages capacity
  → scans QR for check-in
  → exports attendee CSV
  → sends broadcast emails
  → manages event details
```

---

## MINIMUM VIABLE BUILD
Nodes required before first registration:
1, 2, 3, 4, 5, 6, 7, 8, 9, deploy

Check-in, reminders, and admin export are operational improvements.
