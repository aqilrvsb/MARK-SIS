-- ============================================
-- Hack Data: Marketing Reporting System Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Companies
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Users (profiles linked to auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('bod', 'leader', 'marketer')),
  leader_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Facebook Ads columns master list (238 columns)
CREATE TABLE fb_columns (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  category TEXT NOT NULL,
  data_type TEXT NOT NULL DEFAULT 'text',
  is_default BOOLEAN DEFAULT false
);

-- 4. Custom columns per company
CREATE TABLE custom_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  data_type TEXT NOT NULL DEFAULT 'text',
  formula TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, key)
);

-- 5. Company column views (which columns to display)
CREATE TABLE company_column_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default',
  column_order JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, name)
);

-- 6. Data imports tracking
CREATE TABLE data_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  marketer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT,
  row_count INTEGER,
  date_start DATE,
  date_end DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  imported_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Ad data (JSONB for flexible 238+ columns)
CREATE TABLE ad_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  marketer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  import_id UUID NOT NULL REFERENCES data_imports(id) ON DELETE CASCADE,
  date_start DATE,
  date_end DATE,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_ad_data_company ON ad_data(company_id);
CREATE INDEX idx_ad_data_marketer ON ad_data(marketer_id);
CREATE INDEX idx_ad_data_date ON ad_data(date_start, date_end);
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_leader ON users(leader_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_column_views ENABLE ROW LEVEL SECURITY;

-- Companies: users can read their own company
CREATE POLICY "Users can read own company" ON companies FOR SELECT
  USING (id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- Users: can read users in same company
CREATE POLICY "Users can read company members" ON users FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- Users: BOD can insert (create leaders/marketers)
CREATE POLICY "BOD can create users" ON users FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND role = 'bod'
    )
  );

-- Users: BOD can update company members
CREATE POLICY "BOD can update users" ON users FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND role = 'bod'
    )
  );

-- Users: Leaders can insert marketers under themselves
CREATE POLICY "Leaders can create marketers" ON users FOR INSERT
  WITH CHECK (
    role = 'marketer' AND leader_id = auth.uid()
    AND company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND role = 'leader'
    )
  );

-- Ad Data: BOD sees all company data
CREATE POLICY "BOD sees all company data" ON ad_data FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND role = 'bod'
    )
  );

-- Ad Data: Leader sees their team data
CREATE POLICY "Leader sees team data" ON ad_data FOR SELECT
  USING (
    marketer_id IN (
      SELECT id FROM users WHERE leader_id = auth.uid()
    )
    AND company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid() AND role = 'leader'
    )
  );

-- Ad Data: Marketer sees own data
CREATE POLICY "Marketer sees own data" ON ad_data FOR SELECT
  USING (marketer_id = auth.uid());

-- Ad Data: users can insert own data
CREATE POLICY "Users can insert own data" ON ad_data FOR INSERT
  WITH CHECK (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  );

-- Data Imports: same visibility as ad_data
CREATE POLICY "Users see own company imports" ON data_imports FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create imports" ON data_imports FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- Column views: company members can read
CREATE POLICY "Read company column views" ON company_column_views FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "BOD manages column views" ON company_column_views FOR ALL
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role = 'bod'));

-- Custom columns: company members can read
CREATE POLICY "Read custom columns" ON custom_columns FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "BOD manages custom columns" ON custom_columns FOR ALL
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid() AND role = 'bod'));

-- FB columns: everyone can read
ALTER TABLE fb_columns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read fb_columns" ON fb_columns FOR SELECT USING (true);

-- ============================================
-- Allow service role to bypass RLS for registration
-- (handled automatically by Supabase service role)
-- ============================================
