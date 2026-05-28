-- ============================================
-- Fix: RLS policy allows operators/admins to create trips
-- Bug: Operators couldn't insert trips because RLS required role='passenger'
-- Date: 2026-05-29
-- Rollback: drop policy if exists "Operators can create trips" on public.trips;
-- ============================================

-- Add policy allowing operators and admins to create trips
create policy "Operators can create trips"
  on public.trips for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('operator', 'admin')
    )
  );