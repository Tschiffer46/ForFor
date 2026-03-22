-- Migration: Convert customerNumber from integer to text with club prefix
-- Run this BEFORE deploying the new schema
-- Usage: docker compose exec -T postgres psql -U forfor -d forfor < scripts/migrate-customer-numbers.sql

-- Step 1: Add prefix and nextCustomerNumber columns to clubs
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS prefix TEXT;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS next_customer_number INTEGER DEFAULT 10001;

-- Step 2: Convert customer_number from integer to text
-- PostgreSQL can cast integer to text safely
ALTER TABLE customers ALTER COLUMN customer_number TYPE TEXT USING customer_number::TEXT;

-- Step 3: Done! After deploy, set the prefix for each club via the admin UI
-- Then re-import customers or manually update existing customer numbers
