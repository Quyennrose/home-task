-- HomeTask production database reference schema.
-- PostgreSQL syntax. Adjust UUID/default helpers for your managed database.

create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text,
  user_type text not null check (user_type in ('customer', 'helper', 'admin')),
  phone text,
  address text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table helper_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  service text not null,
  application_status text not null default 'pending' check (application_status in ('draft', 'pending', 'approved', 'rejected')),
  rating numeric(2, 1) not null default 0,
  reviews_count integer not null default 0,
  experience text,
  location text,
  verified boolean not null default false,
  image_url text,
  bio text,
  skills text[] not null default '{}',
  certifications text[] not null default '{}',
  hourly_rate integer not null default 80000,
  availability text[] not null default '{}',
  completed_jobs integer not null default 0,
  id_number text,
  service_areas text[] not null default '{}',
  bank_name text,
  bank_account text,
  identity_document_asset_id uuid,
  application_note text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references users(id)
);

create table customer_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  preferences text[] not null default '{}',
  favorite_helpers uuid[] not null default '{}'
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references users(id),
  helper_id uuid references users(id),
  helper_name text,
  service text not null,
  scheduled_date date not null,
  scheduled_time time not null,
  hours integer not null check (hours > 0),
  address text not null,
  address_latitude numeric(10, 7),
  address_longitude numeric(10, 7),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid')),
  total_price integer not null check (total_price >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table booking_progress (
  booking_id uuid primary key references bookings(id) on delete cascade,
  checklist jsonb not null default '[]'::jsonb,
  check_in jsonb,
  check_out jsonb,
  photo_confirmation jsonb,
  updated_at timestamptz not null default now()
);

create table booking_chat_messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  sender_id uuid not null references users(id),
  message text not null,
  created_at timestamptz not null default now()
);

create table booking_reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references bookings(id) on delete cascade,
  helper_id uuid not null references users(id),
  customer_id uuid not null references users(id),
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  service text not null,
  image_urls text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references users(id),
  booking_id uuid references bookings(id),
  purpose text not null,
  filename text not null,
  content_type text not null,
  storage_key text not null unique,
  public_url text,
  created_at timestamptz not null default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id),
  provider text not null,
  provider_reference text,
  amount integer not null check (amount >= 0),
  currency text not null default 'VND',
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references users(id),
  actor_type text not null,
  actor_name text,
  action text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index bookings_customer_id_idx on bookings(customer_id);
create index bookings_helper_id_idx on bookings(helper_id);
create index bookings_status_idx on bookings(status);
create index booking_chat_messages_booking_id_idx on booking_chat_messages(booking_id);
create index notifications_user_id_read_idx on notifications(user_id, read);
create index booking_reviews_helper_id_idx on booking_reviews(helper_id);
create index audit_logs_action_created_at_idx on audit_logs(action, created_at desc);
