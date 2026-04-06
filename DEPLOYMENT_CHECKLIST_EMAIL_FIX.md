# Email Case-Sensitivity Fix - Deployment Checklist

**Status:** Ready for Deployment
**Date Created:** 2026-04-04
**Impact:** CRITICAL - Fixes authentication and duplicate registration vulnerabilities

---

## Pre-Deployment Verification ✅

### Code Changes
- [x] `server/storage-db.ts` - Updated getSubscriberByEmail() and createSubscriber()
- [x] `server/routes.ts` - Normalized contact_email in 3 locations
- [x] `shared/schema.ts` - Added documentation comments to 6 email fields
- [x] `migrations/004_fix_email_case_insensitive_all_tables.sql` - Created

### Documentation
- [x] EMAIL_CASE_SENSITIVITY_FIX.md created (comprehensive reference)
- [x] 003_fix_email_case_insensitive.sql (existing from previous session)
- [x] 004_fix_email_case_insensitive_all_tables.sql (new)

---

## Deployment Steps

### Phase 1: Database Migration (REQUIRED FIRST)
**⚠️ CRITICAL: Apply database migration before deploying code changes**

```bash
# Step 1: Navigate to project directory
cd "C:\Users\Dave\Downloads\Nursing-Rocks-Concerts-Live-Site - 3.0"

# Step 2: Source environment variables
export $(cat .env | grep DATABASE_URL | xargs)

# Step 3: Apply migration
psql $DATABASE_URL -f migrations/004_fix_email_case_insensitive_all_tables.sql

# Step 4: Verify migration success
psql $DATABASE_URL << 'EOF'
-- Verify subscribers constraint
SELECT indexname FROM pg_indexes
WHERE tablename = 'subscribers' AND indexname LIKE '%lower%';

-- Expected: subscribers_email_lower_unique

-- Verify nrpx_registrations constraint
SELECT indexname FROM pg_indexes
WHERE tablename = 'nrpx_registrations' AND indexname LIKE '%lower%';

-- Expected: nrpx_registrations_email_lower_unique

-- Verify all emails are normalized
SELECT COUNT(*) as uppercase_subscribers FROM subscribers
WHERE email != LOWER(email);

-- Expected: 0 rows

SELECT COUNT(*) as uppercase_nrpx FROM nrpx_registrations
WHERE email != LOWER(email);

-- Expected: 0 rows
EOF

# Step 5: Record results
echo "✅ Migration 004 applied successfully" >> deployment.log
```

### Phase 2: Code Deployment

```bash
# Step 1: Commit code changes (if using git)
git add -A
git commit -m "Fix email case-sensitivity across all tables

- Update getSubscriberByEmail() for case-insensitive lookup
- Normalize email in createSubscriber()
- Normalize contact_email in job creation/update routes
- Add documentation comments to schema
- Database migrations: 003 (users) + 004 (subscribers, nrpx_registrations)"

# Step 2: Deploy to production
# (Your deployment process here - Vercel, Docker, etc.)

# Step 3: Verify deployment
curl -s https://nursingrocksconcerts.com/api/health | jq .
# Should return 200 OK
```

### Phase 3: Post-Deployment Verification

```bash
# Step 1: Test email normalization (via API)
curl -X POST https://nursingrocksconcerts.com/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email": "TEST@EXAMPLE.COM"}' \
  -w "\nStatus: %{http_code}\n"

# Expected: 201 Created

curl -X POST https://nursingrocksconcerts.com/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}' \
  -w "\nStatus: %{http_code}\n"

# Expected: 409 Conflict - "Email is already subscribed"

# Step 2: Test login with mixed-case email
# Register as: User@Example.Com
# Login as: user@example.com
# Expected: Success

# Step 3: Monitor logs
# Watch for errors like "[getSubscriberByEmail] Database error"
# Should see no such errors

# Step 4: Check database
psql $DATABASE_URL << 'EOF'
-- Sample verification
SELECT email FROM subscribers LIMIT 5;
-- All should be lowercase

SELECT email FROM nrpx_registrations LIMIT 5;
-- All should be lowercase
EOF
```

---

## Rollback Plan

If issues arise, rollback is **NOT RECOMMENDED** because the database migrations are one-way. Instead:

1. **Keep deployment as-is** - the normalization is one-way and safe
2. **Investigate errors** - check logs for specific issues
3. **Fix code bugs** - if there's a code issue, fix and redeploy
4. **Never revert migration** - it would break production

---

## Testing Checklist

### ✅ Unit Tests (Run Locally)
```typescript
// Example test cases to verify
describe('Email Normalization', () => {
  test('getSubscriberByEmail is case-insensitive', async () => {
    // Setup
    await storage.createSubscriber({ email: 'test@example.com' });

    // Test different cases
    const sub1 = await storage.getSubscriberByEmail('test@example.com');
    const sub2 = await storage.getSubscriberByEmail('TEST@EXAMPLE.COM');
    const sub3 = await storage.getSubscriberByEmail('Test@Example.Com');

    // Verify
    expect(sub1?.id).toBe(sub2?.id);
    expect(sub2?.id).toBe(sub3?.id);
  });

  test('createSubscriber normalizes email', async () => {
    const result = await storage.createSubscriber({
      email: 'TEST@EXAMPLE.COM'
    });

    expect(result.email).toBe('test@example.com');
  });

  test('Duplicate registration with different case is rejected', async () => {
    await storage.createSubscriber({ email: 'test@example.com' });

    // Try with different case
    const response = await api.post('/api/subscribe', {
      email: 'TEST@EXAMPLE.COM'
    });

    expect(response.status).toBe(409);
    expect(response.body.message).toContain('already subscribed');
  });
});
```

### ✅ Integration Tests (After Deployment)
- [ ] Login test: Register with mixed case, login with different case
- [ ] Subscriber test: Subscribe with mixed case, duplicate check
- [ ] Job posting test: Create/update job with mixed-case contact email
- [ ] NRPX registration test: Register with mixed case, verify stored as lowercase

### ✅ Manual Tests (Before Production Approval)
- [ ] Email uniqueness: Try registering same email with different cases
- [ ] Database state: Verify all emails are lowercase
- [ ] Migration verification: Check that case-insensitive indexes exist
- [ ] Error logging: Verify no database errors in logs

---

## Monitoring & Alerts

### What to Monitor
```
ERROR patterns to watch for:
- "CRITICAL: Multiple users found with same email"
- "[getSubscriberByEmail] Database error"
- "Constraint violation: unique constraint"
- "Case sensitivity mismatch"
```

### Metrics to Track
- Duplicate email registration attempts (should increase briefly during testing)
- Failed login attempts with mixed-case emails (should be minimal)
- Database constraint violations (should be zero)

---

## Success Criteria

✅ All criteria must be met before considering deployment complete:

1. **Migration Status**
   - [ ] Migration 004 applied successfully to database
   - [ ] Case-insensitive indexes created on both tables
   - [ ] All emails normalized to lowercase

2. **Code Quality**
   - [ ] All code changes deployed to production
   - [ ] No TypeScript compilation errors
   - [ ] No runtime errors in logs

3. **Functionality**
   - [ ] Email lookups work case-insensitively
   - [ ] Duplicate prevention works across case variations
   - [ ] No false positives or negatives

4. **Security**
   - [ ] No unintended account access via case variations
   - [ ] Token blacklist still functioning
   - [ ] Password reset still secure

5. **User Experience**
   - [ ] Users can login with any email case
   - [ ] Subscription deduplication works transparently
   - [ ] No user-facing errors

---

## Post-Deployment Maintenance

### Weekly Checks
- [ ] No error logs related to email operations
- [ ] Database indexes are healthy (check pg_stat_user_indexes)
- [ ] Email sending is functioning normally

### Monthly Reviews
- [ ] Document any email-related issues
- [ ] Review login patterns for anomalies
- [ ] Update team documentation if needed

### Annual Tasks
- [ ] Review email normalization strategy
- [ ] Check for any new email fields added that need normalization
- [ ] Update migration reference if schema changes

---

## Team Communication

### Pre-Deployment Notification
```
Subject: Email Case-Sensitivity Fix - Deployment Today

This deployment fixes critical email handling issues across:
- User authentication (users table)
- Newsletter subscriptions (subscribers table)
- Event registrations (nrpx_registrations table)
- Job listings (contact_email fields)

Database migration (004) MUST be applied before code deployment.

All emails will be treated as case-insensitive going forward.
```

### Post-Deployment Summary
```
Email case-sensitivity fix deployed successfully:

✅ Database migration 004 applied
✅ Code changes deployed
✅ All verification tests passed
✅ Monitoring enabled

Users can now:
- Login with any email case variation
- Duplicate registrations are prevented
- Contact emails normalized for consistency
```

---

## Issues & Escalation

If you encounter issues during deployment:

1. **Database Migration Fails**
   - Check DATABASE_URL is correct
   - Verify database connectivity
   - Check for permission issues
   - Review error message details

2. **Code Deployment Fails**
   - Check for TypeScript compilation errors
   - Verify all file modifications are correct
   - Check git commits are clean

3. **Post-Deployment Tests Fail**
   - Check database was migrated (Migration 004)
   - Verify code was deployed (check file timestamps)
   - Review error logs for specific issues
   - Test case-insensitive lookups manually

---

## Sign-Off

- [ ] Database migration verified
- [ ] Code deployment verified
- [ ] Integration tests passed
- [ ] Production monitoring confirmed
- [ ] Team notified

**Deployment Date:** _____________
**Deployed By:** _____________
**Verified By:** _____________
