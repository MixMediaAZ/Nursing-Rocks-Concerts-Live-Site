#!/bin/bash

#############################################################################
# Pre-Deployment Verification Script for Email Case-Sensitivity Fix
# This script verifies all code changes are correct before deployment
#############################################################################

set -e

echo "==============================================="
echo "🔍 Email Case-Sensitivity Fix - Pre-Deployment Verification"
echo "==============================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Helper function to print test results
test_check() {
    local description=$1
    local condition=$2

    if [ $condition -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $description"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}: $description"
        ((FAILED++))
    fi
}

echo -e "${BLUE}[1/8]${NC} Checking file modifications..."
test_check "storage-db.ts was modified" $(grep -q "CRITICAL: Normalize email to lowercase for case-insensitive lookup" server/storage-db.ts && echo 0 || echo 1)
test_check "routes.ts was modified (subscriber)" $(grep -q "CRITICAL: Normalize email to lowercase for case-insensitive duplicate check" server/routes.ts && echo 0 || echo 1)
test_check "routes.ts was modified (job contact email)" $(grep -q "CRITICAL: Normalize contact_email if provided" server/routes.ts && echo 0 || echo 1)
test_check "schema.ts documentation added" $(grep -q "IMPORTANT: Email must be lowercase and trimmed" shared/schema.ts && echo 0 || echo 1)
echo ""

echo -e "${BLUE}[2/8]${NC} Checking migration files..."
test_check "Migration 004 exists" $(test -f migrations/004_fix_email_case_insensitive_all_tables.sql && echo 0 || echo 1)
test_check "Migration 004 has DROP CONSTRAINT" $(grep -q "DROP CONSTRAINT subscribers_email_unique" migrations/004_fix_email_case_insensitive_all_tables.sql && echo 0 || echo 1)
test_check "Migration 004 has CREATE INDEX for subscribers" $(grep -q "CREATE UNIQUE INDEX subscribers_email_lower_unique" migrations/004_fix_email_case_insensitive_all_tables.sql && echo 0 || echo 1)
test_check "Migration 004 has CREATE INDEX for nrpx" $(grep -q "CREATE UNIQUE INDEX nrpx_registrations_email_lower_unique" migrations/004_fix_email_case_insensitive_all_tables.sql && echo 0 || echo 1)
echo ""

echo -e "${BLUE}[3/8]${NC} Checking code patterns..."
test_check "getSubscriberByEmail uses LOWER() function" $(grep -q 'lower(${subscribers.email})' server/storage-db.ts && echo 0 || echo 1)
test_check "createSubscriber normalizes email" $(grep -q 'normalizedEmail = insertSubscriber.email.toLowerCase' server/storage-db.ts && echo 0 || echo 1)
test_check "Subscriber route normalizes email" $(grep -q 'const normalizedEmail = email.toLowerCase' server/routes.ts && echo 0 || echo 1)
test_check "Job creation normalizes contact_email" $(grep -q 'normalizedEmail\.toLowerCase' server/routes.ts && echo 0 || echo 1)
echo ""

echo -e "${BLUE}[4/8]${NC} Checking TypeScript compilation..."
if npm run build > /tmp/build.log 2>&1; then
    test_check "TypeScript compilation succeeds" 0
    test_check "No build errors in output" $(grep -q "error" /tmp/build.log && echo 1 || echo 0)
else
    test_check "TypeScript compilation succeeds" 1
    echo "Build output:"
    cat /tmp/build.log
fi
echo ""

echo -e "${BLUE}[5/8]${NC} Checking all email fields documented..."
EMAIL_FIELDS=("users.email" "subscribers.email" "nrpxRegistrations.email" "employers.contact_email" "jobListings.contact_email" "storeOrders.contact_email" "videoSubmissions.email")
for field in "${EMAIL_FIELDS[@]}"; do
    test_check "Documentation added for $field" $(grep -q "IMPORTANT: Email.*lowercase and trimmed" shared/schema.ts && echo 0 || echo 1)
done
echo ""

echo -e "${BLUE}[6/8]${NC} Checking migration syntax..."
test_check "Migration 004 starts with BEGIN" $(head -10 migrations/004_fix_email_case_insensitive_all_tables.sql | grep -q "BEGIN;" && echo 0 || echo 1)
test_check "Migration 004 ends with COMMIT" $(tail -10 migrations/004_fix_email_case_insensitive_all_tables.sql | grep -q "COMMIT;" && echo 0 || echo 1)
test_check "Migration 004 has proper UPDATE statements" $(grep -q "UPDATE.*SET.*email.*LOWER.*TRIM" migrations/004_fix_email_case_insensitive_all_tables.sql && echo 0 || echo 1)
echo ""

echo -e "${BLUE}[7/8]${NC} Checking documentation files..."
test_check "CRITICAL_FIX_SUMMARY.md exists" $(test -f CRITICAL_FIX_SUMMARY.md && echo 0 || echo 1)
test_check "EMAIL_CASE_SENSITIVITY_FIX.md exists" $(test -f EMAIL_CASE_SENSITIVITY_FIX.md && echo 0 || echo 1)
test_check "DEPLOYMENT_CHECKLIST_EMAIL_FIX.md exists" $(test -f DEPLOYMENT_CHECKLIST_EMAIL_FIX.md && echo 0 || echo 1)
test_check "NEXT_STEPS.md exists" $(test -f NEXT_STEPS.md && echo 0 || echo 1)
echo ""

echo -e "${BLUE}[8/8]${NC} Checking for potential issues..."
test_check "No TODO comments left in modified files" $(grep -rn "TODO.*email" server/storage-db.ts server/routes.ts 2>/dev/null | wc -l | grep -q "^0$" && echo 0 || echo 1)
test_check "No console.logs in getSubscriberByEmail" $(grep -A 10 "async getSubscriberByEmail" server/storage-db.ts | grep -q "console\." && echo 1 || echo 0)
test_check "Migration has rollback-safe UPDATE WHERE clause" $(grep -q "WHERE.*!=.*LOWER" migrations/004_fix_email_case_insensitive_all_tables.sql && echo 0 || echo 1)
echo ""

#############################################################################
# Summary
#############################################################################

echo "==============================================="
echo "📊 Verification Summary"
echo "==============================================="
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL CHECKS PASSED - READY FOR DEPLOYMENT${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Read NEXT_STEPS.md for deployment instructions"
    echo "2. Apply Migration 004 to database first"
    echo "3. Deploy code changes"
    echo "4. Run post-deployment tests"
    exit 0
else
    echo -e "${RED}⚠️  SOME CHECKS FAILED - REVIEW BEFORE DEPLOYMENT${NC}"
    echo ""
    echo "Issues to resolve:"
    echo "- Check file modifications are correct"
    echo "- Verify build output for errors"
    echo "- Ensure all documentation is complete"
    exit 1
fi
