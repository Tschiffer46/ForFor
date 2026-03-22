-- Migration: Convert customerNumber from integer to text with club prefix
-- NOTE: Prisma uses camelCase column names, not snake_case!
-- Run this BEFORE deploying the new schema if db push can't handle the type change
-- Usage: docker compose exec -T forfor-db psql -U forfor -d forfor < scripts/migrate-customer-numbers.sql

-- Step 1: Add prefix and nextCustomerNumber columns to clubs
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS prefix TEXT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS "nextCustomerNumber" INTEGER DEFAULT 10001;

-- Step 2: Convert customerNumber from integer to text
ALTER TABLE customers ALTER COLUMN "customerNumber" TYPE TEXT USING "customerNumber"::TEXT;
