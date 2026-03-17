# NODE: payments-stripe
## One-time payments via Stripe

---

## SOLUTION
Stripe — stripe.com

## STACK VARIANT
Any Node.js backend

## DEPENDENCIES
- fix-ts-errors [LOCKED]
- auth node [LOCKED]
- db node [LOCKED]

## INPUTS REQUIRED
- STRIPE_SECRET_KEY (from Stripe dashboard)
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY or VITE_STRIPE_PUBLISHABLE_KEY
- STRIPE_WEBHOOK_SECRET (from Stripe webhook settings)

## INSTRUCTIONS

### Step 1 — Check existing Stripe install
```bash
grep "stripe" package.json
grep "STRIPE" .env*
```
If Stripe already installed and keys present — go to Step 4.

### Step 2 — Install
```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

### Step 3 — Environment variables
```
STRIPE_SECRET_KEY=sk_test_xxxx
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxx   # React+Vite
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxx  # Next.js
STRIPE_WEBHOOK_SECRET=whsec_xxxx
```

### Step 4 — Server: create payment intent
```typescript
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

app.post('/api/payments/create-intent', requireAuth, async (req, res) => {
  const { amount, currency = 'usd', metadata = {} } = req.body;
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // convert to cents
      currency,
      metadata: { userId: req.user.id, ...metadata },
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
```

### Step 5 — Server: webhook handler
```typescript
app.post('/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err) {
      return res.status(400).json({ error: 'Webhook signature failed' });
    }
    switch (event.type) {
      case 'payment_intent.succeeded':
        const pi = event.data.object as Stripe.PaymentIntent;
        // Update order status in DB
        console.log('Payment succeeded:', pi.id);
        break;
      case 'payment_intent.payment_failed':
        console.log('Payment failed:', event.data.object);
        break;
    }
    res.json({ received: true });
  }
);
```

### Step 6 — Client: checkout component
```typescript
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function CheckoutForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + '/order-confirmation' },
    });
    if (error) console.error(error);
    else onSuccess();
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit" disabled={!stripe}>Pay Now</button>
    </form>
  );
}

export function StripeCheckout({ amount }: { amount: number }) {
  const [clientSecret, setClientSecret] = React.useState('');

  React.useEffect(() => {
    fetch('/api/payments/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    })
      .then(r => r.json())
      .then(data => setClientSecret(data.clientSecret));
  }, [amount]);

  if (!clientSecret) return <div>Loading...</div>;

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm onSuccess={() => window.location.href = '/order-confirmation'} />
    </Elements>
  );
}
```

## VALIDATION
```
1. POST /api/payments/create-intent { amount: 10 } → returns clientSecret
2. Render StripeCheckout component → Stripe UI loads
3. Use test card 4242 4242 4242 4242 → payment succeeds
4. Webhook receives payment_intent.succeeded event
5. Use test card 4000 0000 0000 9995 → payment fails gracefully
```

## LOCKED_BY
- order confirmation node
- email confirmation (triggered by webhook)

## OUTPUT
- Payment intent creation endpoint
- Stripe webhook handler
- Client checkout component
- Test payment verified end-to-end

## FAILURE MODES

**Failure Mode 1: Webhook signature fails**
Webhook secret must match Stripe dashboard exactly.
In local dev use Stripe CLI: `stripe listen --forward-to localhost:3000/api/payments/webhook`

**Failure Mode 2: Amount in wrong format**
Stripe uses cents (integers). Always multiply by 100 and round.

**Failure Mode 3: CORS blocking Stripe**
Stripe JS loads from external CDN. Ensure CSP allows stripe.com.
