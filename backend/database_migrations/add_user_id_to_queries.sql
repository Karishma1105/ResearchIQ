-- Migration: Add user_id column to queries table
ALTER TABLE queries
ADD COLUMN user_id uuid;