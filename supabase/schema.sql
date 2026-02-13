-- Supabase schema for LVMH Clienteling (Admin/Manager scope)
-- Safe defaults: UUIDs everywhere, enums, indexes, and RLS scaffolding.

-- Extensions
create extension if not exists "pgcrypto";

-- Enums
do $$ begin
  create type seller_status as enum ('active', 'inactive');
exception when duplicate_object then null; end $$;

do $$ begin
  create type client_temperature as enum ('HOT', 'WARM', 'COLD');
exception when duplicate_object then null; end $$;

do $$ begin
  create type client_type as enum ('buyer', 'prospect');
exception when duplicate_object then null; end $$;

do $$ begin
  create type interaction_phase as enum ('discovery', 'fitting', 'objection', 'closing');
exception when duplicate_object then null; end $$;

do $$ begin
  create type recommendation_action as enum ('call_back', 'offer_product', 'invite_event', 'wait');
exception when duplicate_object then null; end $$;

do $$ begin
  create type recommendation_status as enum ('pending', 'done', 'ignored');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_role as enum ('seller', 'manager');
exception when duplicate_object then null; end $$;

do $$ begin
  create type alert_type as enum ('hot_not_followed', 'overload', 'conversion_drop', 'idle_client', 'objections_repeat');
exception when duplicate_object then null; end $$;

do $$ begin
  create type alert_severity as enum ('low', 'medium', 'high');
exception when duplicate_object then null; end $$;

-- 1. Organisation & roles
create table if not exists houses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists sellers (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references houses(id) on delete cascade,
  full_name text not null,
  email text unique,
  status seller_status not null default 'active',
  created_at timestamptz not null default now()
);

-- Manager profile linked to auth.users
create table if not exists manager_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  house_id uuid not null references houses(id) on delete cascade,
  full_name text not null,
  created_at timestamptz not null default now()
);

-- Optional HQ profiles (global read access)
create table if not exists headquarters_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null,
  created_at timestamptz not null default now()
);

-- 2. Clients (Digital Client Twin)
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references houses(id) on delete cascade,
  full_name text not null,
  intent_score int check (intent_score between 0 and 100),
  temperature client_temperature,
  estimated_budget numeric(12,2),
  dominant_emotion text,
  purchase_probability numeric(5,2) check (purchase_probability between 0 and 100),
  last_interaction_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists client_assignments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  seller_id uuid not null references sellers(id) on delete cascade,
  active boolean not null default true,
  assigned_at timestamptz not null default now()
);

create table if not exists client_attributes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  key text not null,
  value text,
  updated_at timestamptz not null default now()
);

-- 3. Voice & Transcription
create table if not exists voice_records (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references sellers(id) on delete set null,
  client_id uuid not null references clients(id) on delete set null,
  audio_url text not null,
  duration int,
  created_at timestamptz not null default now()
);

create table if not exists transcriptions (
  id uuid primary key default gen_random_uuid(),
  voice_record_id uuid not null references voice_records(id) on delete cascade,
  raw_text text not null,
  language text,
  confidence_score numeric(5,2),
  created_at timestamptz not null default now()
);

create table if not exists cleaned_transcriptions (
  id uuid primary key default gen_random_uuid(),
  transcription_id uuid not null references transcriptions(id) on delete cascade,
  cleaned_text text not null,
  created_at timestamptz not null default now()
);

-- 4. AI Extraction
create table if not exists interactions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  seller_id uuid not null references sellers(id) on delete set null,
  ai_summary text,
  client_type client_type,
  phase interaction_phase,
  intention text,
  budget_estimated numeric(12,2),
  timing text,
  dominant_emotion text,
  intent_score int check (intent_score between 0 and 100),
  created_at timestamptz not null default now()
);

create table if not exists interaction_entities (
  id uuid primary key default gen_random_uuid(),
  interaction_id uuid not null references interactions(id) on delete cascade,
  entity_type text not null,
  entity_value text not null
);

-- 5. Scoring history
create table if not exists intent_scores_history (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  interaction_id uuid references interactions(id) on delete set null,
  score int check (score between 0 and 100),
  created_at timestamptz not null default now()
);

-- 6. Recommendations
create table if not exists recommendations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  seller_id uuid references sellers(id) on delete set null,
  action_type recommendation_action not null,
  payload text,
  status recommendation_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- 7. Notifications
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null,
  role notification_role not null,
  title text not null,
  message text,
  related_client_id uuid references clients(id) on delete set null,
  related_seller_id uuid references sellers(id) on delete set null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- 8. Manager Alerts
create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references houses(id) on delete cascade,
  seller_id uuid references sellers(id) on delete set null,
  client_id uuid references clients(id) on delete set null,
  type alert_type not null,
  severity alert_severity not null default 'medium',
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

-- 9. Reassignment audit
create table if not exists reassignment_events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  from_seller_id uuid references sellers(id) on delete set null,
  to_seller_id uuid references sellers(id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);

-- 10. KPI & stats
create table if not exists seller_metrics_daily (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references sellers(id) on delete cascade,
  date date not null,
  conversion_rate numeric(5,2),
  avg_basket numeric(12,2),
  closings int,
  ai_assisted_sales int
);

create table if not exists house_metrics_daily (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references houses(id) on delete cascade,
  date date not null,
  active_clients int,
  hot_clients int,
  estimated_pipeline numeric(12,2),
  alerts_count int
);

-- 11. Activity logs
create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_sellers_house on sellers(house_id);
create index if not exists idx_clients_house on clients(house_id);
create index if not exists idx_client_assignments_client on client_assignments(client_id);
create index if not exists idx_client_assignments_seller on client_assignments(seller_id);
create index if not exists idx_interactions_client on interactions(client_id);
create index if not exists idx_interactions_seller on interactions(seller_id);
create index if not exists idx_alerts_house on alerts(house_id);
create index if not exists idx_alerts_type on alerts(type);
create index if not exists idx_notifications_recipient on notifications(recipient_id);

-- Unique constraints (one active assignment per client at a time)
create unique index if not exists uq_active_client_assignment
  on client_assignments(client_id)
  where active = true;

-- RLS (Row Level Security) - baseline
alter table houses enable row level security;
alter table sellers enable row level security;
alter table manager_profiles enable row level security;
alter table headquarters_profiles enable row level security;
alter table clients enable row level security;
alter table client_assignments enable row level security;
alter table client_attributes enable row level security;
alter table voice_records enable row level security;
alter table transcriptions enable row level security;
alter table cleaned_transcriptions enable row level security;
alter table interactions enable row level security;
alter table interaction_entities enable row level security;
alter table intent_scores_history enable row level security;
alter table recommendations enable row level security;
alter table notifications enable row level security;
alter table alerts enable row level security;
alter table reassignment_events enable row level security;
alter table seller_metrics_daily enable row level security;
alter table house_metrics_daily enable row level security;
alter table activity_logs enable row level security;

-- RLS policies (Managers can access their house scope)
create policy "managers_select_house" on houses
  for select using (exists (
    select 1 from manager_profiles mp where mp.id = auth.uid() and mp.house_id = houses.id
  ));

create policy "managers_select_sellers" on sellers
  for select using (exists (
    select 1 from manager_profiles mp where mp.id = auth.uid() and mp.house_id = sellers.house_id
  ));

create policy "managers_select_clients" on clients
  for select using (exists (
    select 1 from manager_profiles mp where mp.id = auth.uid() and mp.house_id = clients.house_id
  ));

create policy "managers_select_alerts" on alerts
  for select using (exists (
    select 1 from manager_profiles mp where mp.id = auth.uid() and mp.house_id = alerts.house_id
  ));

-- HQ profiles: read-only global access
create policy "hq_read_all_houses" on houses
  for select using (exists (select 1 from headquarters_profiles hp where hp.id = auth.uid()));

create policy "hq_read_all_sellers" on sellers
  for select using (exists (select 1 from headquarters_profiles hp where hp.id = auth.uid()));

create policy "hq_read_all_clients" on clients
  for select using (exists (select 1 from headquarters_profiles hp where hp.id = auth.uid()));

create policy "hq_read_all_alerts" on alerts
  for select using (exists (select 1 from headquarters_profiles hp where hp.id = auth.uid()));
