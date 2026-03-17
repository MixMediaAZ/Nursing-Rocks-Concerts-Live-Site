# NODE: auth-passport-jwt
## Authentication via Passport.js + JWT

---

## SOLUTION
Passport.js + jsonwebtoken + bcrypt

## STACK VARIANT
Express + TypeScript

## DEPENDENCIES
- fix-ts-errors [LOCKED] if errors exist
- db node [LOCKED] — users table must exist

## INPUTS REQUIRED
- JWT_SECRET in .env (min 32 chars, random string)
- Users table with: id, email, password_hash fields

## INSTRUCTIONS

### Step 1 — Check if already implemented
```bash
grep -r "passport\|jsonwebtoken\|bcrypt" package.json server/
```
If fully implemented → run validation only. Do not reinstall.

### Step 2 — Install if missing
```bash
npm install passport passport-local jsonwebtoken bcrypt express-session
npm install -D @types/passport @types/passport-local @types/jsonwebtoken @types/bcrypt @types/express-session
```

### Step 3 — Environment variable
```
JWT_SECRET=your-random-32-char-string-here
SESSION_SECRET=another-random-32-char-string
```

### Step 4 — Auth middleware (server/auth.ts)
```typescript
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      const user = await db.query.users.findFirst({ where: eq(users.email, email) });
      if (!user) return done(null, false, { message: 'Invalid credentials' });
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return done(null, false, { message: 'Invalid credentials' });
      return done(null, user);
    } catch (err) { return done(err); }
  }
));

export function generateToken(userId: number): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '7d' });
}

export function requireAuth(req: any, res: any, next: any) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    req.user = { id: payload.userId };
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}
```

### Step 5 — Auth routes (in server/routes.ts)
```typescript
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  const hash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(users).values({ email, password_hash: hash }).returning();
  const token = generateToken(user.id);
  res.json({ token, user: { id: user.id, email: user.email } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user || !await bcrypt.compare(password, user.password_hash))
    return res.status(401).json({ error: 'Invalid credentials' });
  const token = generateToken(user.id);
  res.json({ token, user: { id: user.id, email: user.email } });
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  const user = await db.query.users.findFirst({ where: eq(users.id, req.user.id) });
  res.json(user);
});
```

## VALIDATION
```
1. POST /api/auth/register { email, password } → returns token
2. POST /api/auth/login { email, password } → returns token
3. GET /api/auth/me with Bearer token → returns user object
4. GET /api/auth/me without token → returns 401
5. POST /api/auth/login wrong password → returns 401
```

## LOCKED_BY
All nodes that use requireAuth middleware

## OUTPUT
- Working register, login, me endpoints
- JWT token generation
- requireAuth middleware available

## FAILURE MODES

**Failure Mode 1: JWT_SECRET missing in production**
Add to Vercel/Railway environment variables.
Never hardcode. Server should throw on startup if missing.

**Failure Mode 2: bcrypt too slow**
Default rounds is 10. Change to 12 for production security.
Never go below 10.

**Failure Mode 3: Token expiry too short**
Default 7d is reasonable. Adjust per app requirements.
Add refresh token logic only if explicitly required.
