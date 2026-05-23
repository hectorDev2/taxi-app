-- Panel-specific columns for trips
alter table public.trips add column if not exists code text;
alter table public.trips add column if not exists service_type text default 'passengers' check (service_type in ('passengers', 'cargo_passengers'));
alter table public.trips add column if not exists channel text default 'phone' check (channel in ('phone', 'app', 'walkin'));
alter table public.trips add column if not exists operator_id uuid references public.profiles(id);
alter table public.trips add column if not exists passenger_name text;
alter table public.trips add column if not exists passenger_phone text;

-- Panel-specific columns for vehicles
alter table public.vehicles add column if not exists code text;
alter table public.vehicles add column if not exists vehicle_type text default 'passengers' check (vehicle_type in ('passengers', 'cargo_passengers'));

-- Tariff config table
create table if not exists public.tariff_config (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  base_fare decimal(10,2) not null default 5.00,
  cost_per_km decimal(10,2) not null default 2.50,
  cost_per_minute decimal(10,2) not null default 0.50,
  night_surcharge decimal(5,2) not null default 25.00,
  vehicle_type_surcharge decimal(5,2) not null default 20.00,
  valid_from timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger on_tariff_config_updated
  before update on public.tariff_config
  for each row execute function public.handle_updated_at();

alter table public.tariff_config enable row level security;

create policy "Anyone can read tariff config"
  on public.tariff_config for select
  using (true);

create policy "Admin can update tariff config"
  on public.tariff_config for update
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')
  ));

-- Broaden profile access for panel
drop policy if exists "Anyone can read profiles" on public.profiles;
create policy "Anyone can read profiles"
  on public.profiles for select
  using (true);

create policy "Admin can update any profile"
  on public.profiles for update
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

-- Broaden vehicle access for panel
drop policy if exists "Anyone can read active vehicles" on public.vehicles;
create policy "Anyone can read vehicles"
  on public.vehicles for select
  using (true);

create policy "Panel can manage vehicles"
  on public.vehicles for insert
  with check (exists (
    select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')
  ));

create policy "Panel can update vehicles"
  on public.vehicles for update
  using (true);

create policy "Panel can delete vehicles"
  on public.vehicles for delete
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')
  ));

-- Broaden trip access for panel
drop policy if exists "Passengers can read own trips" on public.trips;
drop policy if exists "Drivers can read trips in their area" on public.trips;
drop policy if exists "Passengers can create trips" on public.trips;
drop policy if exists "Drivers can accept / update assigned trips" on public.trips;

create policy "Anyone can read trips"
  on public.trips for select
  using (true);

create policy "Panel and passengers can create trips"
  on public.trips for insert
  with check (true);

create policy "Involved users can update trips"
  on public.trips for update
  using (true);

-- Add realtime for vehicles
alter publication supabase_realtime add table public.vehicles;
alter publication supabase_realtime add table public.tariff_config;
