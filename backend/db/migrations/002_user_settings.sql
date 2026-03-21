create table if not exists user_settings (
  user_id uuid primary key references users(id) on delete cascade,
  ai_provider text,
  max_messages_per_hour int,
  max_messages_per_minute int,
  min_delay_seconds int,
  max_delay_seconds int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_settings_ai_provider on user_settings(ai_provider);

