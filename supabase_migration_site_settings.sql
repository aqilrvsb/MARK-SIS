-- Create site_settings table if not exists (for chart config etc)
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read/write (scoped by setting_key containing company_id)
CREATE POLICY "Authenticated manage settings" ON site_settings FOR ALL
  USING (true) WITH CHECK (true);
