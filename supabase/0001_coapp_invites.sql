-- Co-applicant remote invite pathway.
-- Run this once against the production Supabase project (SQL editor → New query → paste → Run).

create table if not exists public.coapp_invites (
  id                          uuid primary key default gen_random_uuid(),
  token                       text not null unique,
  primary_first_name          text not null,
  primary_last_name           text not null,
  primary_email               text,
  relationship                text not null check (relationship in ('spouse','relative','partner','other')),
  co_applicant_phone          text not null,
  co_applicant_data           jsonb,
  co_applicant_license_file_name text,
  co_applicant_submitted_at   timestamptz,
  merged_into_application_id  uuid references public.applications(id) on delete set null,
  created_at                  timestamptz not null default now()
);

create index if not exists coapp_invites_token_idx on public.coapp_invites (token);

-- Primary's application row carries the same token so a late co-app submit can find it.
alter table public.applications
  add column if not exists coapp_invite_token text;

create index if not exists applications_coapp_invite_token_idx
  on public.applications (coapp_invite_token);
