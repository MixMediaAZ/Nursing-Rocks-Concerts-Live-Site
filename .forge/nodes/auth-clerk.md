# NODE: auth-clerk
## Authentication via Clerk

---

## SOLUTION
Clerk — clerk.com

## STACK VARIANT
Next.js

## DEPENDENCIES
- fix-ts-errors [LOCKED] if errors exist

## INPUTS REQUIRED
- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- CLERK_SECRET_KEY
(Both from clerk.com dashboard — free tier available)

## INSTRUCTIONS

### Step 1 — Install
```bash
npm install @clerk/nextjs
```

### Step 2 — Environment variables
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxx
CLERK_SECRET_KEY=sk_test_xxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### Step 3 — Wrap app in ClerkProvider
In app/layout.tsx:
```typescript
import { ClerkProvider } from '@clerk/nextjs';
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en"><body>{children}</body></html>
    </ClerkProvider>
  );
}
```

### Step 4 — Middleware
Create middleware.ts in project root:
```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/']);
export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) auth().protect();
});
export const config = { matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'] };
```

### Step 5 — Sign in / Sign up pages
```bash
mkdir -p app/sign-in/[[...sign-in]] app/sign-up/[[...sign-up]]
```

app/sign-in/[[...sign-in]]/page.tsx:
```typescript
import { SignIn } from '@clerk/nextjs';
export default function Page() { return <SignIn />; }
```

app/sign-up/[[...sign-up]]/page.tsx:
```typescript
import { SignUp } from '@clerk/nextjs';
export default function Page() { return <SignUp />; }
```

### Step 6 — Auth in API routes
```typescript
import { auth } from '@clerk/nextjs/server';
export async function GET() {
  const { userId } = auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  return Response.json({ userId });
}
```

## VALIDATION
```
1. npm run dev starts without errors
2. Navigate to /sign-up → Clerk UI renders
3. Create test account → redirects to /dashboard
4. Navigate to protected route without auth → redirects to /sign-in
5. API route with auth() returns userId correctly
```

## LOCKED_BY
All protected routes and API endpoints

## OUTPUT
- Clerk auth fully wired
- Sign in / sign up pages
- Middleware protecting routes
- Auth available in API routes

## FAILURE MODES

**Failure Mode 1: Middleware not catching routes**
Check matcher pattern in middleware.ts.
Verify routes are not accidentally in public list.

**Failure Mode 2: Clerk UI not rendering**
Confirm ClerkProvider wraps entire app in layout.tsx.
Check publishable key starts with pk_.

**Failure Mode 3: Webhook needed for DB sync**
If syncing Clerk users to own DB, add webhook endpoint.
Use svix for webhook verification.
This is a separate node — do not add here.
