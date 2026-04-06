# 🎸 Ticket System Upgrades — Implementation Plan

**Status:** 3 critical features needed for full venue operations
**Priority:** Venue scanner (P0) → Admin reports (P1) → Offline fallback (P2)

---

## 🎯 Priority 1: Venue Scanner UI (P0 — CRITICAL)

**Why:** Gate staff cannot verify tickets without this.
**Effort:** ~3-4 hours
**Dependencies:** None (backend ready)

### Overview
Build a **dedicated web app** for gate staff to scan ticket QR codes and check in attendees. Reuse the generic `/scan` template but customize for ticket events (not NRPX).

### Architecture
```
/scan-tickets  (new route, similar to existing /scan)
├─ Authentication: Admin PIN or staff credentials
├─ Camera: QR code scanner (html5-qrcode lib)
├─ API: POST /api/tickets/scan
├─ Response: ✅ Green (accepted) / 🔴 Red (rejected)
└─ Stats: Real-time: X checked in / Y total
```

### Implementation Steps

**Step 1: Create Scanner Component** (30 min)
```bash
# File: client/src/pages/scan-tickets.tsx
# Based on: client/src/pages/scan.tsx (NRPX version)
# Modifications needed:
# - Change endpoint: /api/nrpx/verify → /api/tickets/scan
# - Change PIN: VITE_SCANNER_PIN → VITE_TICKET_SCANNER_PIN
# - Remove NRPX-specific fields
# - Show user name on ticket from DB
```

**Features to include:**
- PIN authentication (configurable via env var)
- Event selector dropdown (for multi-event venues)
- Real-time stats: "X/Y checked in"
- Large result display:
  - ✅ **GREEN** — "Ticket Accepted" + ticket code
  - 🔴 **RED** — "Ticket Invalid/Used" + reason
- Auto-reset after 3.5 seconds
- Manual refresh button
- Responsive for iPad/tablet at gate

**Step 2: Create Routes** (15 min)
```tsx
// client/src/pages/scan-tickets.tsx
export default function ScanTicketsPage() {
  // Similar structure to scan.tsx
  // POST /api/tickets/scan with { qrToken, eventId, deviceFingerprint }
}
```

Add to client routing:
```tsx
<Route path="/scan-tickets" component={ScanTicketsPage} />
```

**Step 3: Environment Configuration** (10 min)
```bash
# .env.example (add)
VITE_TICKET_SCANNER_PIN=1234  # Gate staff PIN

# Vercel env vars (add)
VITE_TICKET_SCANNER_PIN=<production-pin>
```

**Step 4: Testing** (30 min)
- [ ] Test QR scan (from email)
- [ ] Test manual ticket code entry (fallback)
- [ ] Test already-checked-in rejection
- [ ] Test expired ticket rejection
- [ ] Test device mismatch detection
- [ ] Test on iPad/mobile

### Response Handling

**Backend sends:**
```json
{
  "ok": true,
  "reason": "checked_in",
  "message": "Ticket accepted",
  "ticketCode": "NR-2026-ABC123"
}
```

**Frontend displays:**
```
✅ WELCOME
NR-2026-ABC123

Tap to scan again
─────────────────
Checked in: 45 / 200 registered
```

### Fallback: Manual Code Entry
If QR scan fails, add text input for ticket code:
```tsx
<Input
  placeholder="NR-2026-ABC123"
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      submitTicketCode(e.currentTarget.value);
    }
  }}
/>
```

Then POST to `/api/tickets/validate/{code}` endpoint (public read-only).

---

## 📊 Priority 2: Admin Reports (P1 — HIGH)

**Why:** Need visibility into check-ins, fraud detection, troubleshooting
**Effort:** ~4-5 hours
**Dependencies:** Venue scanner (ideally working first)

### Overview
Create admin dashboard page showing:
1. **Real-time stats** — Live check-in progress
2. **Scan audit log** — All scan attempts with results
3. **Device analysis** — Detect shared tickets
4. **Rejection breakdown** — Why tickets failed
5. **Export** — CSV download for records

### UI Layout

```
┌─ Ticket Check-In Report ────────────────────────────┐
│                                                      │
│ Event: [May 16, 2026 - NRCS Phoenix]  📊 Stats     │
│ ─────────────────────────────────────────────────    │
│                                                      │
│ ✅ 127 Checked In   ⏳ 73 Pending   📊 200 Total    │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                      │
│ Filter: [Status ▼] [Reason ▼]  [CSV↓]              │
│                                                      │
│ SCAN AUDIT LOG                                       │
│ ──────────────────────────────────────────────────   │
│ Time     │ Ticket    │ Name      │ Status │ Reason  │
│ 6:47 PM  │ NR-ABC123 │ John Doe  │ ✅    │ Checked │
│ 6:46 PM  │ NR-XYZ789 │ Jane Dey  │ ❌    │ Used    │
│ ...      │ ...       │ ...       │ ...    │ ...     │
│                                                      │
└──────────────────────────────────────────────────────┘

DEVICE ANALYSIS
───────────────
Tickets scanned from 2+ devices (possible sharing):
 • NR-2026-QWE456 — Scan 1: iPhone Safari
               — Scan 2: Android Chrome (REJECTED)
 • NR-2026-RTY789 — Scan 1: iPad (Gate 1)
               — Scan 2: iPhone (Gate 2, different location)
```

### Implementation Steps

**Step 1: Create Reports Page** (45 min)
```bash
# File: client/src/pages/admin/reports.tsx
# Features:
# - Event selector
# - Date range picker
# - Real-time stat cards (checked in / total)
# - Filterable table with scan logs
```

**Step 2: Query Scan Logs** (1 hour)
```bash
# New endpoint: GET /api/admin/events/:id/scan-stats
# Returns:
{
  "eventId": 5,
  "eventTitle": "NRCS Phoenix",
  "checkedIn": 127,
  "total": 200,
  "rejections": [
    { "reason": "already_used", "count": 18 },
    { "reason": "expired", "count": 3 },
    { "reason": "device_mismatch", "count": 2 }
  ],
  "scanLog": [
    {
      "ticketCode": "NR-2026-ABC123",
      "userName": "John Doe",
      "result": "accepted",
      "scannedAt": "2026-05-16T18:47:00Z",
      "deviceFingerprint": "device-123-xyz"
    },
    ...
  ]
}
```

**Step 3: Device Analysis** (1.5 hours)
```bash
# New endpoint: GET /api/admin/events/:id/device-analysis
# Returns:
{
  "sharedTickets": [
    {
      "ticketCode": "NR-2026-QWE456",
      "devices": [
        { "fingerprint": "device-1", "count": 1, "lastScan": "..." },
        { "fingerprint": "device-2", "count": 1, "lastScan": "..." }
      ],
      "risk": "HIGH"  // Multiple devices scanned this ticket
    }
  ]
}
```

**Step 4: CSV Export** (45 min)
```bash
# Download ticket: scan_report_2026-05-16.csv
# Fields:
TicketCode,UserName,Result,Reason,ScannedAt,Device,IP,UserAgent
NR-2026-ABC123,John Doe,accepted,checked_in,2026-05-16T18:47:00Z,device-123,192.168.1.1,Mozilla/5.0...
```

**Step 5: Admin Nav** (15 min)
Add to admin sidebar:
```tsx
<NavLink to="/admin/reports">📊 Ticket Reports</NavLink>
```

### API Requirements

**New endpoints (backend):**
```
GET /api/admin/events/:id/scan-stats
GET /api/admin/events/:id/device-analysis
GET /api/admin/events/:id/scan-log-csv (for CSV download)
```

**Existing endpoints (reuse):**
```
GET /api/admin/events  (list events)
```

---

## 🔌 Priority 3: Offline Fallback (P2 — NICE-TO-HAVE)

**Why:** If internet fails at venue, can't verify tickets.
**Effort:** ~6-8 hours (complex sync logic)
**Risk:** Medium (requires careful testing)

### Problem
Gate staff phone loses internet → can't POST to `/api/tickets/scan` → can't verify tickets.

### Solution Options

#### Option A: Offline-First (Recommended)
**Before event:** Sync ticket QR codes + metadata to local storage
**At venue:** Verify tickets locally, sync changes when online

**Complexity:** Medium
**Feasibility:** Good (only need QR tokens + hashes)

**Flow:**
```
1. Admin downloads: "Event 5 - Sync Offline"
   → Fetches all issued tickets for event
   → Stores: [ticketCode, qrToken, userId, expires_at]
   → Caches locally or IndexedDB

2. Gate staff scans QR
   → Verify JWT locally (if have QR_TOKEN_SECRET)
   → Mark as checked_in locally
   → Add to sync queue

3. Internet returns
   → POST queued check-ins to server
   → Sync timestamps + device info
   → Reconcile conflicts
```

**Implementation effort breakdown:**
- Download/cache (1.5 hrs)
- Local JWT verification (1 hr)
- Queue management (1.5 hrs)
- Sync & conflict resolution (2.5 hrs)
- Testing edge cases (1.5 hrs)

**Files needed:**
```bash
client/src/lib/offline-store.ts      # IndexedDB management
client/src/hooks/useOfflineSync.ts   # Sync queue logic
client/src/pages/scan-tickets-offline.tsx  # Alternative scanner
```

#### Option B: Printed Backup List (Simpler)
**Before event:** Print ticket list
**At venue:** Manual checklist if internet fails

**Complexity:** Low
**Feasibility:** Excellent (existing CSV export)

**Process:**
```
1. Generate report: "Ticket Check-In Checklist"
2. Export CSV with ticket codes
3. Print for gate staff
4. If internet fails, use printed list (checkmark by hand)
5. Sync to system later
```

**Risks:** Human error, lost checklist

### Recommendation

**For now:** Use **Option B** (printed backup) — simple, proven
**Later:** Add **Option A** (offline-first) — better UX for future venues

**To implement Option B:**
```bash
# Add to Reports page:
<Button onClick={downloadPrintableChecklist}>
  📋 Print Check-In Checklist
</Button>

# File: client/src/components/ChecklistExport.tsx
# Generates: ticket_codes.pdf
# Fields: Ticket Code | Name | Check-in | Notes
```

**To implement Option A (later):**
```bash
# 1. Add sync endpoint
POST /api/admin/events/:id/sync-offline
Body: [{ ticketCode, checkedInAt, deviceId }, ...]

# 2. Add download endpoint
GET /api/admin/events/:id/download-offline-data
Returns: { tickets: [...], eventData: {...} }

# 3. Implement offline scanner page
/scan-tickets-offline (uses IndexedDB)
```

---

## 📋 Implementation Checklist

### Phase 1: Venue Scanner (Week 1)
- [ ] Copy `scan.tsx` → `scan-tickets.tsx`
- [ ] Modify endpoint: `/api/nrpx/verify` → `/api/tickets/scan`
- [ ] Update stats endpoint
- [ ] Add event selector
- [ ] Test with real QR codes
- [ ] Configure VITE_TICKET_SCANNER_PIN
- [ ] Deploy to Vercel
- [ ] Test on iPad at gate

### Phase 2: Admin Reports (Week 2)
- [ ] Create `admin/reports.tsx` page
- [ ] Build stat cards (checked in / total)
- [ ] Add scan log table
- [ ] Add filter: by result (accepted/rejected)
- [ ] Add filter: by reason (used, expired, device_mismatch)
- [ ] Create device analysis UI
- [ ] Add CSV export button
- [ ] Connect to API endpoints
- [ ] Test data accuracy
- [ ] Deploy to Vercel

### Phase 3: Offline Fallback (Week 3+)
- [ ] Decide: Option A or Option B
- **If Option B:**
  - [ ] Add "Print Checklist" button to Reports
  - [ ] Generate PDF with ticket codes
  - [ ] Distribute printed list to gate staff
  - [ ] Test manual sync after event

- **If Option A:**
  - [ ] Create offline sync endpoint
  - [ ] Build offline data download UI
  - [ ] Implement local JWT verification
  - [ ] Build sync queue (IndexedDB)
  - [ ] Test internet disconnect scenarios
  - [ ] Add conflict resolution logic

---

## 🧪 Testing Scenarios

### Venue Scanner
```
1. Scan valid ticket → ✅ Green (accepted)
2. Scan same ticket again → 🔴 Red (already used)
3. Scan expired ticket → 🔴 Red (expired)
4. Scan ticket from different device → 🔴 Red (device mismatch)
5. Scan invalid QR → 🔴 Red (token invalid)
6. Test manual ticket code entry (fallback)
7. Test stats update in real-time
8. Test on iPad (landscape + portrait)
9. Test PIN-protected access
10. Test with multiple events
```

### Admin Reports
```
1. Check total checked in / total count accuracy
2. Filter by status (accepted/rejected)
3. Filter by reason (used, expired, device_mismatch)
4. Verify device analysis shows multiple devices
5. Export CSV and verify format
6. Check timestamps match local time
7. Test with 0 events, 1 event, 100 events
8. Verify no sensitive data in reports (passwords, tokens)
```

### Offline Fallback
```
1. Download offline data (if Option A)
2. Disable internet
3. Scan ticket locally
4. Verify feedback displays
5. Re-enable internet
6. Verify sync completes
7. Check ticketScanLogs has correct data
8. Test with 10, 100, 1000 tickets
```

---

## 📦 Environment Variables Needed

```bash
# .env.example (add)
VITE_TICKET_SCANNER_PIN=1234

# Vercel production env (add)
VITE_TICKET_SCANNER_PIN=<secure-pin>
```

---

## 🚀 Deployment Steps

### For Venue Scanner
```bash
1. git add client/src/pages/scan-tickets.tsx
2. Update .env
3. npm run build
4. git push → auto-deploys to Vercel
5. Test at https://nursingrocksconcerts.com/scan-tickets
```

### For Admin Reports
```bash
1. git add client/src/pages/admin/reports.tsx
2. git add server/routes.ts (new endpoints)
3. npm run build
4. git push → auto-deploys
5. Test at https://nursingrocksconcerts.com/admin/reports
```

---

## 💬 Questions / Decisions Needed

1. **Pin timeout:** Should PIN expire? (currently persistent per session)
2. **Multiple events:** Can one gate handle multiple concurrent events?
3. **Staff authentication:** PIN-only or OAuth/staff accounts?
4. **Offline priority:** Now (Option B) or later (Option A)?
5. **Device fingerprinting:** How strict? (Browser UA + Canvas hash, or simple?)
6. **Fraud threshold:** At how many devices is ticket flagged?

---

## ✅ Success Criteria

### Venue Scanner
- Gate staff can scan QR code in <2 seconds
- Feedback visible from 10 feet away
- Works on iPad/tablet
- Handles 50 scans/minute without lag
- 99% scan success rate

### Admin Reports
- Load event with 10,000 scans in <3 seconds
- CSV export handles 10,000 rows
- Device analysis identifies shared tickets
- Admins can troubleshoot issues with scan logs
- Reports exportable for record-keeping

### Offline Fallback
- If internet fails, gate staff has backup method
- Sync completes within 5 minutes of reconnect
- No data loss or duplicate check-ins
- Printed backup list is <2 pages
