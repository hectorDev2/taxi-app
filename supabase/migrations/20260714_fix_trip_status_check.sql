-- ============================================
-- Fix: Add 'assigned' to trip status check constraint
-- Bug: tripService.assign() sets status='assigned' but the CHECK constraint
--      only allowed 'pending','accepted','arrived','in_progress','completed','cancelled'
--      causing the UPDATE to fail silently (data returned null, no error thrown)
-- Date: 2026-07-14
-- Rollback: drop constraint if exists trips_status_check and re-add without 'assigned'
-- ============================================

alter table public.trips
  drop constraint if exists trips_status_check;

alter table public.trips
  add constraint trips_status_check
  check (status in (
    'pending', 'assigned', 'accepted', 'arrived', 'in_progress', 'completed', 'cancelled'
  ));
