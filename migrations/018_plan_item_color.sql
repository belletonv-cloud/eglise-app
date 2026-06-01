-- Migration 018: add color column to plan_items
-- Allows color-coding service items (songs, headers, announcements, etc.)
ALTER TABLE plan_items ADD COLUMN color TEXT DEFAULT NULL;
