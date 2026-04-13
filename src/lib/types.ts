export type UserRole = "bod" | "leader" | "marketer";

export interface Company {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  company_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  leader_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FbColumn {
  id: number;
  key: string;
  label: string;
  category: string;
  data_type: string;
  is_default: boolean;
}

export interface CustomColumn {
  id: string;
  company_id: string;
  key: string;
  label: string;
  data_type: string;
  formula: string | null;
  created_at: string;
}

export interface CompanyColumnView {
  id: string;
  company_id: string;
  name: string;
  column_order: string[];
  is_default: boolean;
  created_at: string;
}

export interface DataImport {
  id: string;
  company_id: string;
  marketer_id: string;
  file_name: string | null;
  row_count: number | null;
  status: "pending" | "processing" | "completed" | "failed";
  error_message: string | null;
  imported_at: string;
}

export interface AdData {
  id: string;
  company_id: string;
  marketer_id: string;
  import_id: string;
  date_start: string;
  date_end: string;
  data: Record<string, unknown>;
  created_at: string;
}
