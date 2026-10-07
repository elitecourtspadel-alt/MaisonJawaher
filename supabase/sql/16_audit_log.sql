-- 11 · Audit history: who changed what, and when. Written by the app and shown on the "Audit history" page.
create table if not exists public.audit_log (
  id            uuid primary key default gen_random_uuid(),
  actor_id      uuid references public.app_users(id) on delete set null,
  actor_name    text not null default '',          -- kept as text so history stays readable if a user is removed
  action        text not null,                     -- created, changed, deleted, turned_on, turned_off, signed_in ...
  entity        text not null,                     -- product, category, setting ...
  entity_id     text,
  entity_label  text not null default '',          -- for example the product name at that moment
  summary       text not null,                     -- the plain-language sentence
  details       jsonb not null default '[]'::jsonb,  -- [{label, from, to}]
  is_active     boolean not null default true,
  created_by    uuid references public.app_users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_by    uuid references public.app_users(id) on delete set null,
  updated_at    timestamptz not null default now()
);
create index if not exists audit_log_created_idx on public.audit_log(created_at desc);

drop trigger if exists trg_audit_log_touch on public.audit_log;
create trigger trg_audit_log_touch before update on public.audit_log
  for each row execute function public.touch_updated_at();
