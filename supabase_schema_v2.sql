-- ============================================
-- Hack Data v2: Full Schema with KPI, Alerts, Brands, Scores
-- Run this in Supabase SQL Editor AFTER v1 schema
-- ============================================

-- ============================================
-- BRANDS (multi-brand per company)
-- ============================================
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, name)
);

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company members read brands" ON brands FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));
CREATE POLICY "BOD manages brands" ON brands FOR ALL
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role = 'bod'));

-- Add brand_id to ad_data
ALTER TABLE ad_data ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE SET NULL;
-- Add brand_id to data_imports
ALTER TABLE data_imports ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE SET NULL;

-- ============================================
-- KPI TARGETS
-- ============================================
CREATE TABLE IF NOT EXISTS kpi_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL = company-wide default
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE, -- NULL = all brands
  metric TEXT NOT NULL, -- 'cpa', 'roas', 'ctr', 'cpc', 'daily_spend', 'monthly_spend'
  target_value NUMERIC NOT NULL,
  warning_threshold NUMERIC, -- yellow zone (e.g. CPA target=5, warning=7, red=10)
  danger_threshold NUMERIC,  -- red zone
  direction TEXT NOT NULL DEFAULT 'lower_is_better', -- 'lower_is_better' or 'higher_is_better'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE kpi_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company reads KPI targets" ON kpi_targets FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));
CREATE POLICY "BOD manages KPI targets" ON kpi_targets FOR ALL
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role = 'bod'));

-- ============================================
-- MARKETER SCORES (daily calculated)
-- ============================================
CREATE TABLE IF NOT EXISTS marketer_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  marketer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  score_date DATE NOT NULL,
  total_spend NUMERIC DEFAULT 0,
  total_impressions BIGINT DEFAULT 0,
  total_clicks BIGINT DEFAULT 0,
  total_leads BIGINT DEFAULT 0,
  total_purchases BIGINT DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  avg_cpa NUMERIC,
  avg_roas NUMERIC,
  avg_ctr NUMERIC,
  avg_cpc NUMERIC,
  score_rating TEXT DEFAULT 'neutral', -- 'excellent', 'good', 'neutral', 'warning', 'danger'
  campaigns_active INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(marketer_id, score_date, brand_id)
);

ALTER TABLE marketer_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "BOD sees all scores" ON marketer_scores FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role = 'bod'));
CREATE POLICY "Leader sees team scores" ON marketer_scores FOR SELECT
  USING (marketer_id IN (SELECT id FROM users WHERE leader_id = auth.uid()));
CREATE POLICY "Marketer sees own scores" ON marketer_scores FOR SELECT
  USING (marketer_id = auth.uid());
CREATE POLICY "System can insert scores" ON marketer_scores FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- ============================================
-- ALERTS
-- ============================================
CREATE TABLE IF NOT EXISTS alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  metric TEXT NOT NULL, -- 'cpa', 'roas', 'daily_spend', 'no_spend', 'frequency', 'ctr'
  condition TEXT NOT NULL, -- 'above', 'below', 'equals', 'no_data'
  threshold NUMERIC,
  severity TEXT NOT NULL DEFAULT 'warning', -- 'info', 'warning', 'critical'
  notify_roles TEXT[] DEFAULT '{"bod","leader"}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES alert_rules(id) ON DELETE SET NULL,
  marketer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  campaign_name TEXT,
  metric TEXT NOT NULL,
  current_value NUMERIC,
  threshold_value NUMERIC,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company reads alert rules" ON alert_rules FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));
CREATE POLICY "BOD manages alert rules" ON alert_rules FOR ALL
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role = 'bod'));
CREATE POLICY "Company reads alert history" ON alert_history FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));
CREATE POLICY "System inserts alerts" ON alert_history FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- ============================================
-- CLIENT SHARING (read-only access)
-- ============================================
CREATE TABLE IF NOT EXISTS client_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  client_name TEXT NOT NULL,
  client_email TEXT,
  columns_visible JSONB, -- which columns the client can see
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE client_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "BOD manages client shares" ON client_shares FOR ALL
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role = 'bod'));

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_marketer_scores_date ON marketer_scores(score_date);
CREATE INDEX IF NOT EXISTS idx_marketer_scores_marketer ON marketer_scores(marketer_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_company ON alert_history(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ad_data_brand ON ad_data(brand_id);
CREATE INDEX IF NOT EXISTS idx_kpi_targets_company ON kpi_targets(company_id);
