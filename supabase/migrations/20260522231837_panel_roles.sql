-- Add panel management roles to profiles
alter table public.profiles
  drop constraint if exists profiles_role_check,
  add constraint profiles_role_check
    check (role in ('admin', 'operator', 'driver', 'passenger'));
