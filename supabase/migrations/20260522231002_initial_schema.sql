-- ============================================
-- TAXI APP — Initial Schema
-- ============================================

-- 0. Extensions
create extension if not exists "pgcrypto";

-- 1. Profiles (drivers + passengers)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role text not null check (role in ('driver', 'passenger')),
  full_name text,
  phone text,
  avatar_url text,
  is_verified boolean not null default false,
  is_online boolean not null default false,
  current_latitude double precision,
  current_longitude double precision,
  last_location_update timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Vehicles (registered by drivers)
create table public.vehicles (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  brand text not null,
  model text not null,
  year integer not null,
  license_plate text not null unique,
  color text,
  seats integer not null default 4 check (seats >= 1 and seats <= 9),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Trips
create table public.trips (
  id uuid default gen_random_uuid() primary key,
  passenger_id uuid not null references public.profiles(id) on delete cascade,
  driver_id uuid references public.profiles(id),
  vehicle_id uuid references public.vehicles(id),
  status text not null default 'pending' check (status in (
    'pending', 'accepted', 'arrived', 'in_progress', 'completed', 'cancelled'
  )),

  -- origin
  pickup_latitude double precision not null,
  pickup_longitude double precision not null,
  pickup_address text,

  -- destination
  dropoff_latitude double precision not null,
  dropoff_longitude double precision not null,
  dropoff_address text,

  -- pricing
  estimated_price decimal(10,2),
  final_price decimal(10,2),
  currency text not null default 'ARS',

  -- timing
  requested_at timestamptz not null default now(),
  accepted_at timestamptz,
  arrived_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  cancelled_by text check (cancelled_by in ('passenger', 'driver', 'system')),

  -- driver realtime location during trip
  driver_current_latitude double precision,
  driver_current_longitude double precision,
  driver_location_updated_at timestamptz,

  updated_at timestamptz not null default now()
);

-- 4. Trip status history (audit log)
create table public.trip_status_history (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid not null references public.trips(id) on delete cascade,
  status text not null,
  changed_by uuid references public.profiles(id),
  changed_at timestamptz not null default now()
);

-- 5. Payments
create table public.payments (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid not null references public.trips(id) on delete cascade unique,
  amount decimal(10,2) not null check (amount >= 0),
  currency text not null default 'ARS',
  method text check (method in ('cash', 'card', 'mercadopago', 'other')),
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed', 'refunded')),
  stripe_payment_intent_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Ratings
create table public.ratings (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid not null references public.trips(id) on delete cascade unique,
  passenger_id uuid not null references public.profiles(id),
  driver_id uuid not null references public.profiles(id),
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz not null default now()
);

-- ============================================
-- INDEXES
-- ============================================
create index idx_vehicles_owner on public.vehicles(owner_id);
create index idx_vehicles_active on public.vehicles(is_active);
create index idx_trips_passenger on public.trips(passenger_id);
create index idx_trips_driver on public.trips(driver_id);
create index idx_trips_status on public.trips(status);
create index idx_trips_passenger_status on public.trips(passenger_id, status);
create index idx_trips_driver_status on public.trips(driver_id, status);
create index idx_trip_history_trip on public.trip_status_history(trip_id);
create index idx_payments_trip on public.payments(trip_id);
create index idx_ratings_trip on public.ratings(trip_id);
create index idx_profiles_role on public.profiles(role);
create index idx_profiles_online on public.profiles(is_online) where is_online = true;

-- ============================================
-- TRIGGER: auto-update updated_at
-- ============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profiles_updated
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger on_vehicles_updated
  before update on public.vehicles
  for each row execute function public.handle_updated_at();

create trigger on_trips_updated
  before update on public.trips
  for each row execute function public.handle_updated_at();

create trigger on_payments_updated
  before update on public.payments
  for each row execute function public.handle_updated_at();

-- ============================================
-- TRIGGER: auto-create profile on signup
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'passenger'),
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = '';

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- TRIGGER: log trip status changes
-- ============================================
create or replace function public.handle_trip_status_change()
returns trigger as $$
begin
  insert into public.trip_status_history (trip_id, status, changed_by)
  values (new.id, new.status, auth.uid());
  return new;
end;
$$ language plpgsql security definer set search_path = '';

create trigger on_trip_status_change
  after update of status on public.trips
  for each row when (old.status is distinct from new.status)
  execute function public.handle_trip_status_change();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_status_history enable row level security;
alter table public.payments enable row level security;
alter table public.ratings enable row level security;

-- Profiles
create policy "Anyone can read profiles"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Vehicles
create policy "Anyone can read active vehicles"
  on public.vehicles for select
  using (is_active = true or owner_id = auth.uid());

create policy "Drivers can insert own vehicles"
  on public.vehicles for insert
  with check (
    auth.uid() = owner_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'driver'
    )
  );

create policy "Drivers can update own vehicles"
  on public.vehicles for update
  using (auth.uid() = owner_id);

create policy "Drivers can delete own vehicles"
  on public.vehicles for delete
  using (auth.uid() = owner_id);

-- Trips
create policy "Passengers can read own trips"
  on public.trips for select
  using (passenger_id = auth.uid());

create policy "Drivers can read trips in their area"
  on public.trips for select
  using (
    driver_id = auth.uid()
    or (
      status = 'pending'
      and exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'driver'
      )
    )
  );

create policy "Passengers can create trips"
  on public.trips for insert
  with check (
    auth.uid() = passenger_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'passenger'
    )
  );

create policy "Drivers can accept / update assigned trips"
  on public.trips for update
  using (driver_id = auth.uid() or passenger_id = auth.uid());

-- Trip status history
create policy "Involved users can read trip history"
  on public.trip_status_history for select
  using (
    exists (
      select 1 from public.trips
      where trips.id = trip_status_history.trip_id
      and (trips.passenger_id = auth.uid() or trips.driver_id = auth.uid())
    )
  );

create policy "System can insert trip history"
  on public.trip_status_history for insert
  with check (true);  -- only the trigger inserts, which runs as security definer

-- Payments
create policy "Involved users can read payments"
  on public.payments for select
  using (
    exists (
      select 1 from public.trips
      where trips.id = payments.trip_id
      and (trips.passenger_id = auth.uid() or trips.driver_id = auth.uid())
    )
  );

create policy "System can insert payments"
  on public.payments for insert
  with check (true);

create policy "System can update payments"
  on public.payments for update
  using (true);

-- Ratings
create policy "Anyone can read ratings"
  on public.ratings for select
  using (true);

create policy "Passengers can rate their trips"
  on public.ratings for insert
  with check (
    exists (
      select 1 from public.trips
      where trips.id = ratings.trip_id
      and trips.passenger_id = auth.uid()
      and trips.status = 'completed'
    )
  );

-- ============================================
-- REALTIME (for driver location tracking)
-- ============================================
alter publication supabase_realtime add table public.trips;
alter publication supabase_realtime add table public.profiles;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Find nearby available drivers (within radius in km)
create or replace function public.nearby_drivers(
  lat double precision,
  lng double precision,
  radius_km double precision default 5
)
returns table (
  id uuid,
  full_name text,
  avatar_url text,
  current_latitude double precision,
  current_longitude double precision,
  distance_km double precision,
  vehicle_id uuid,
  vehicle_brand text,
  vehicle_model text,
  vehicle_color text,
  vehicle_seats integer
)
language sql stable
as $$
  select
    p.id,
    p.full_name,
    p.avatar_url,
    p.current_latitude,
    p.current_longitude,
    (
      6371 * acos(
        cos(radians(lat)) * cos(radians(p.current_latitude))
        * cos(radians(p.current_longitude) - radians(lng))
        + sin(radians(lat)) * sin(radians(p.current_latitude))
      )
    ) as distance_km,
    v.id as vehicle_id,
    v.brand as vehicle_brand,
    v.model as vehicle_model,
    v.color as vehicle_color,
    v.seats as vehicle_seats
  from public.profiles p
  join public.vehicles v on v.owner_id = p.id and v.is_active = true
  where p.role = 'driver'
    and p.is_online = true
    and p.current_latitude is not null
    and p.current_longitude is not null
    and (
      6371 * acos(
        cos(radians(lat)) * cos(radians(p.current_latitude))
        * cos(radians(p.current_longitude) - radians(lng))
        + sin(radians(lat)) * sin(radians(p.current_latitude))
      )
    ) <= radius_km
  order by distance_km;
$$;
