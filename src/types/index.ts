export interface Session {
  userId:      string;
  token:       string;
  username:    string;
  displayName: string;
  role:        'admin' | 'parish';
  parishId:    string | null;
  expiresAt:   number;
}

export interface Parish {
  id:                string;
  parish_name:       string;
  city:              string | null;
  coordinator_name:  string | null;
  coordinator_phone: string | null;
  coordinator_email: string | null;
  status:            'active' | 'inactive';
  created_at:        string;
}

export interface Stage {
  id:         string;
  stage_name: string;
  category:   string;
  sort_order: number;
}

export interface AgeGroup {
  id:          string;
  age_group:   string;
  description: string | null;
}

export interface Book {
  id:                string;
  book_name:         string;
  author:            string | null;
  publisher:         string | null;
  recommended_stage: string | null;
  recommended_age:   string | null;
  year:              string | null;
  created_at:        string;
}

export interface UserProfile {
  id:           string;
  username:     string;
  display_name: string | null;
  role:         'admin' | 'parish';
  parish_id:    string | null;
  status:       'active' | 'inactive';
  created_at:   string;
}

export interface CatechesisRecord {
  id:         string;
  parish_id:  string;
  stage_id:   string | null;
  age_id:     string | null;
  book_name:  string;
  author:     string | null;
  publisher:  string | null;
  year:       string | null;
  notes:      string | null;
  status:     'draft' | 'submitted' | 'confirmed';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardKpis {
  totalRecords:   number;
  activeParishes: number;
  distinctBooks:  number;
  stagesCovered:  number;
  uniformRate:    number;
}

export interface DashboardData {
  kpis:        DashboardKpis;
  topBooks:    { name: string; count: number; parishes: number }[];
  byParish:    { name: string; count: number }[];
  byStage:     { name: string; count: number }[];
  divergences: { stageId: string; stageName: string; bookCount: number; books: { name: string; parishes: string[] }[] }[];
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id:      string;
  message: string;
  type:    ToastType;
}
