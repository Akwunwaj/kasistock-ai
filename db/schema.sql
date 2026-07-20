-- KasiStock AI relational baseline for PostgreSQL 17+
-- Monetary values are stored as integer cents. Raw AI output, human-accepted
-- evidence, identity mappings, deterministic calculations and approvals are
-- separate authority layers.

create extension if not exists pgcrypto;

create table merchants (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  country_code char(2) not null default 'ZA',
  created_at timestamptz not null default now()
);

create table evidence_uploads (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id),
  kind text not null check (kind in ('shelf_image', 'supplier_catalogue', 'sales_history')),
  filename text not null,
  media_type text not null,
  sha256 text not null,
  storage_key text not null,
  size_bytes bigint not null check (size_bytes > 0),
  uploaded_at timestamptz not null default now(),
  unique (merchant_id, sha256)
);

create table extraction_jobs (
  id uuid primary key default gen_random_uuid(),
  evidence_upload_id uuid not null references evidence_uploads(id),
  processor_name text not null,
  contract_version text not null,
  response_id text,
  status text not null check (status in ('pending', 'running', 'completed', 'failed')),
  raw_response jsonb,
  validated_output jsonb,
  review_issues jsonb not null default '[]'::jsonb,
  output_sha256 text,
  error_code text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table accepted_evidence_snapshots (
  id uuid primary key,
  merchant_id uuid not null references merchants(id),
  source_extraction_job_id uuid not null references extraction_jobs(id),
  kind text not null check (kind in ('shelf_image', 'supplier_catalogue', 'sales_history')),
  version integer not null check (version = 1),
  source_sha256 text not null,
  accepted_payload jsonb not null,
  review_decisions jsonb not null default '[]'::jsonb,
  evidence_hash text not null unique,
  accepted_by text not null,
  accepted_at timestamptz not null,
  unique (source_extraction_job_id, version)
);

create table canonical_products (
  id text primary key,
  display_name text not null,
  unit_label text not null,
  barcodes text[] not null default '{}',
  target_days_cover numeric(8,3) not null check (target_days_cover > 0),
  safety_stock_units integer not null check (safety_stock_units >= 0),
  essentiality_score integer not null check (essentiality_score between 0 and 10),
  expiry_risk_score integer not null check (expiry_risk_score between 0 and 10),
  catalogue_version text not null,
  created_at timestamptz not null default now()
);

create table product_aliases (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references canonical_products(id),
  alias text not null,
  normalised_alias text not null,
  created_at timestamptz not null default now(),
  unique (product_id, normalised_alias)
);

create table accepted_product_mapping_sets (
  id uuid primary key,
  merchant_id uuid not null references merchants(id),
  version integer not null check (version = 1),
  source_evidence_hashes text[] not null,
  decisions jsonb not null,
  accepted_by text not null,
  accepted_at timestamptz not null,
  mapping_hash text not null unique
);

create table restock_scenarios (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id),
  mapping_set_id uuid not null references accepted_product_mapping_sets(id),
  source_evidence_hashes text[] not null,
  budget_cents bigint not null check (budget_cents >= 0),
  calculation_version text not null,
  optimiser_version text not null,
  status text not null check (status in ('draft', 'calculated', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table restock_calculation_versions (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references restock_scenarios(id),
  version integer not null,
  mapping_hash text not null,
  evidence_hashes text[] not null,
  calculation_payload jsonb not null,
  optimiser_input_payload jsonb not null,
  calculated_at timestamptz not null default now(),
  unique (scenario_id, version)
);

create table recommendation_versions (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references restock_scenarios(id),
  calculation_version_id uuid not null references restock_calculation_versions(id),
  version integer not null,
  result_payload jsonb not null,
  total_cost_cents bigint not null check (total_cost_cents >= 0),
  explanation_payload jsonb,
  generated_at timestamptz not null default now(),
  unique (scenario_id, version)
);

create table purchase_order_drafts (
  id uuid primary key,
  scenario_id uuid references restock_scenarios(id),
  merchant_id uuid not null references merchants(id),
  version integer not null check (version = 1),
  status text not null check (status in ('pending_approval', 'approved', 'superseded')),
  source_evidence_hashes text[] not null,
  mapping_hash text not null,
  recommendation_hash text not null,
  calculation_version text not null,
  optimiser_version text not null,
  budget_cents bigint not null check (budget_cents > 0),
  merchant_profile jsonb not null,
  fulfilment jsonb not null,
  lines jsonb not null,
  total_cost_cents bigint not null check (total_cost_cents > 0),
  remaining_cents bigint not null check (remaining_cents >= 0),
  expected_margin_cents bigint not null,
  draft_hash text not null unique,
  created_at timestamptz not null
);

create table approval_records (
  id uuid primary key,
  scenario_id uuid references restock_scenarios(id),
  purchase_order_draft_id uuid not null references purchase_order_drafts(id),
  recommendation_version_id uuid references recommendation_versions(id),
  status text not null check (status in ('approved', 'rejected')),
  actor_id text not null,
  draft_hash text not null,
  recommendation_hash text not null,
  evidence_hashes text[] not null,
  mapping_hash text not null,
  confirmation_text text not null,
  approval_hash text not null unique,
  decided_at timestamptz not null,
  unique (purchase_order_draft_id)
);

create table supplier_purchase_orders (
  id uuid primary key,
  purchase_order_draft_id uuid not null references purchase_order_drafts(id),
  approval_record_id uuid not null references approval_records(id),
  purchase_order_number text not null unique,
  supplier_id text not null,
  supplier_name text not null,
  merchant_profile jsonb not null,
  fulfilment jsonb not null,
  subtotal_cents bigint not null check (subtotal_cents > 0),
  total_cents bigint not null check (total_cents > 0),
  currency char(3) not null default 'ZAR',
  draft_hash text not null,
  approval_hash text not null,
  purchase_order_hash text not null unique,
  generated_at timestamptz not null
);

create table supplier_purchase_order_lines (
  id uuid primary key default gen_random_uuid(),
  supplier_purchase_order_id uuid not null references supplier_purchase_orders(id),
  product_id text not null references canonical_products(id),
  product_name text not null,
  pack_quantity integer not null check (pack_quantity > 0),
  selected_packs integer not null check (selected_packs > 0),
  selected_units integer not null check (selected_units > 0),
  pack_cost_cents bigint not null check (pack_cost_cents > 0),
  line_cost_cents bigint not null check (line_cost_cents > 0),
  unique (supplier_purchase_order_id, product_id)
);

create table supplier_messages (
  id uuid primary key default gen_random_uuid(),
  supplier_purchase_order_id uuid not null references supplier_purchase_orders(id),
  channel text not null check (channel in ('whatsapp_ready')),
  body text not null,
  created_at timestamptz not null default now(),
  unique (supplier_purchase_order_id, channel)
);

create table audit_events (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid references restock_scenarios(id),
  actor_type text not null check (actor_type in ('merchant', 'system', 'model')),
  actor_id text not null,
  event_type text not null,
  input_version text,
  output_version text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index evidence_uploads_merchant_kind_idx on evidence_uploads (merchant_id, kind, uploaded_at desc);
create index extraction_jobs_evidence_idx on extraction_jobs (evidence_upload_id, created_at desc);
create index accepted_mapping_sets_merchant_idx on accepted_product_mapping_sets (merchant_id, accepted_at desc);
create index purchase_order_drafts_merchant_time_idx on purchase_order_drafts (merchant_id, created_at desc);
create index supplier_purchase_orders_draft_idx on supplier_purchase_orders (purchase_order_draft_id, generated_at desc);
create index audit_events_scenario_time_idx on audit_events (scenario_id, occurred_at);
