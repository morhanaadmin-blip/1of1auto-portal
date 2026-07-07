ALTER TABLE public.coapp_invites
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days';
