-- ============================================================================
-- MaRe Match — initial schema
-- ============================================================================

create extension if not exists "uuid-ossp";

create table if not exists prospects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  website_url text not null,
  instagram_url text,
  city text,
  state text,
  notes text,
  status text not null default 'new'
    check (status in ('new','analyzing','analyzed','approved','sent')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists prospect_sources (
  id uuid primary key default uuid_generate_v4(),
  prospect_id uuid not null references prospects(id) on delete cascade,
  source_type text not null,
  source_url text,
  raw_content text,
  parsed_content text,
  screenshot_url text,
  metadata_json jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists prospect_scores (
  id uuid primary key default uuid_generate_v4(),
  prospect_id uuid not null references prospects(id) on delete cascade,
  total_score numeric not null,
  recommendation text not null,
  revenue_band text not null,
  revenue_confidence text not null,
  aesthetic_score numeric,
  service_score numeric,
  retail_score numeric,
  wellness_score numeric,
  clientele_score numeric,
  operational_score numeric,
  scale_score numeric,
  revenue_likelihood_score numeric,
  exclusivity_score numeric,
  scoring_json jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists prospect_evidence (
  id uuid primary key default uuid_generate_v4(),
  prospect_id uuid not null references prospects(id) on delete cascade,
  category text not null,
  claim text not null,
  source_type text not null,
  source_url text,
  excerpt text,
  confidence text not null,
  created_at timestamptz not null default now()
);

create table if not exists microsites (
  id uuid primary key default uuid_generate_v4(),
  prospect_id uuid not null references prospects(id) on delete cascade,
  slug text not null unique,
  hero_title text not null,
  hero_subtitle text not null,
  why_selected_json jsonb not null,
  mare_system_json jsonb not null,
  implementation_json jsonb not null,
  next_step_json jsonb not null,
  theme_json jsonb default '{}'::jsonb,
  why_different_body text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists outreach_assets (
  id uuid primary key default uuid_generate_v4(),
  prospect_id uuid not null references prospects(id) on delete cascade,
  email_subject text,
  email_body text,
  dm_body text,
  postcard_copy text,
  call_opener text,
  version_number int not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists approval_states (
  prospect_id uuid primary key references prospects(id) on delete cascade,
  fit_score_approved boolean not null default false,
  microsite_approved boolean not null default false,
  outreach_approved boolean not null default false,
  approved_by text,
  approved_at timestamptz,
  notes text
);

create table if not exists generation_versions (
  id uuid primary key default uuid_generate_v4(),
  prospect_id uuid not null references prospects(id) on delete cascade,
  object_type text not null check (object_type in ('score','microsite','outreach')),
  version_number int not null,
  payload_json jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_sources_prospect on prospect_sources (prospect_id);
create index if not exists idx_evidence_prospect on prospect_evidence (prospect_id);
create index if not exists idx_scores_prospect on prospect_scores (prospect_id, created_at desc);
create index if not exists idx_outreach_prospect on outreach_assets (prospect_id, version_number desc);
create index if not exists idx_versions_prospect on generation_versions (prospect_id, object_type, version_number desc);
