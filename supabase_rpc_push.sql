-- ============================================
-- RPC function for Chrome extension to push data directly
-- Runs with SECURITY DEFINER (bypasses RLS)
-- Extension calls: supabase.rpc('push_ad_data', { ... })
-- ============================================

CREATE OR REPLACE FUNCTION public.push_ad_data(
  p_staff_id TEXT,
  p_rows JSONB,
  p_date_start DATE,
  p_date_end DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_import_id UUID;
  v_row JSONB;
  v_count INT := 0;
BEGIN
  -- 1. Look up user by staff ID
  SELECT id, company_id, full_name, id_staff, is_active
  INTO v_user
  FROM public.users
  WHERE id_staff = UPPER(TRIM(p_staff_id))
  LIMIT 1;

  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid Staff ID');
  END IF;

  IF NOT v_user.is_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'Account deactivated');
  END IF;

  -- 2. Check if rows provided
  IF p_rows IS NULL OR jsonb_array_length(p_rows) = 0 THEN
    -- Just verifying — return success with user info
    RETURN jsonb_build_object('success', true, 'message', 'Verified: ' || v_user.full_name, 'verified', true);
  END IF;

  -- 3. Create import record
  INSERT INTO public.data_imports (company_id, marketer_id, file_name, row_count, date_start, date_end, status)
  VALUES (v_user.company_id, v_user.id, 'extension_push_' || NOW()::TEXT, jsonb_array_length(p_rows), p_date_start, p_date_end, 'processing')
  RETURNING id INTO v_import_id;

  -- 4. Insert ad data rows
  FOR v_row IN SELECT * FROM jsonb_array_elements(p_rows)
  LOOP
    INSERT INTO public.ad_data (company_id, marketer_id, import_id, date_start, date_end, data)
    VALUES (v_user.company_id, v_user.id, v_import_id, p_date_start, p_date_end, v_row);
    v_count := v_count + 1;
  END LOOP;

  -- 5. Mark import as completed
  UPDATE public.data_imports SET status = 'completed' WHERE id = v_import_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', v_count || ' records imported for ' || v_user.full_name || ' (' || v_user.id_staff || ')',
    'import_id', v_import_id,
    'row_count', v_count
  );
END;
$$;
