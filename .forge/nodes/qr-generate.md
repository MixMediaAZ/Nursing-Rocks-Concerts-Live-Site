# NODE: qr-generate
## QR code generation for tickets, links, verification

---

## SOLUTION
qrcode npm package

## STACK VARIANT
Any Node.js backend

## DEPENDENCIES
- fix-ts-errors [LOCKED]
- auth node [LOCKED]

## INPUTS REQUIRED
- The data to encode (ticket code, URL, or identifier)
- Where QR will be displayed (email, dashboard, print)

## INSTRUCTIONS

### Step 1 — Install
```bash
npm install qrcode
npm install -D @types/qrcode
```

### Step 2 — Create QR service
Create server/services/qr.ts:
```typescript
import QRCode from 'qrcode';

export async function generateQRDataUrl(
  data: string,
  options?: { size?: number; foreground?: string; background?: string }
): Promise<string> {
  return QRCode.toDataURL(data, {
    width: options?.size || 300,
    margin: 2,
    color: {
      dark: options?.foreground || '#000000',
      light: options?.background || '#ffffff',
    },
  });
}

export async function generateQRBuffer(data: string): Promise<Buffer> {
  return QRCode.toBuffer(data, { width: 300, margin: 2 });
}
```

### Step 3 — Add endpoint
```typescript
import { generateQRDataUrl } from './services/qr';

app.get('/api/qr/:data', requireAuth, async (req, res) => {
  const qr = await generateQRDataUrl(req.params.data);
  res.json({ qr });
});
```

### Step 4 — Use in email templates
```typescript
const qrDataUrl = await generateQRDataUrl(ticketCode);
// Embed directly in HTML email as <img src="${qrDataUrl}" />
```

### Step 5 — Display in React component
```typescript
export function QRDisplay({ data, size = 200 }: { data: string; size?: number }) {
  const { data: qrData } = useQuery({
    queryKey: ['qr', data],
    queryFn: () => fetch(`/api/qr/${data}`).then(r => r.json()),
  });
  if (!qrData) return <div>Loading...</div>;
  return <img src={qrData.qr} alt="QR Code" width={size} height={size} />;
}
```

## VALIDATION
```
1. GET /api/qr/TEST123 → returns { qr: 'data:image/png;base64,...' }
2. Image renders in browser
3. QR scans correctly with phone camera (value = TEST123)
4. QR embedded in email renders in Gmail + Apple Mail
```

## LOCKED_BY
- Any node that displays or emails QR codes

## OUTPUT
- QR generation service
- API endpoint for on-demand generation
- React display component

## FAILURE MODES

**Failure Mode 1: QR too small to scan**
Increase width to 400. Minimum display size 150x150px.

**Failure Mode 2: QR not scanning in email**
Email clients sometimes block or resize images.
Use data URL (base64 inline) — already implemented above.
Ensure image displays at minimum 150x150px in email template.
