export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'admin' | 'faculty';
  department: string;
  is_active: boolean;
  created_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ResearchPaper {
  id: number;
  title: string;
  abstract?: string;
  authors_raw?: string;
  authors_list: string[];
  department: string;
  journal_or_conference?: string;
  publication_type?: string;
  publication_date?: string;
  publication_year: number;
  doi?: string;
  keywords_list: string[];
  categories_list: string[];
  pdf_filename?: string;
  pdf_url?: string;
  ml_confidence: number;
  ml_predicted_dept?: string;
  ai_summary?: string;
  citation_count: number;
  email_source_subject?: string;
  created_at?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  is_custom: boolean;
  created_at?: string;
}

export interface EmailLog {
  id: number;
  sender: string;
  subject: string;
  body_snippet?: string;
  status: 'processed' | 'rejected_spam' | 'error' | 'pending';
  ml_classification_score: number;
  ml_predicted_class: string;
  extracted_paper_id?: number;
  error_message?: string;
  received_at?: string;
}

export interface DeptStats {
  department: string;
  count: number;
}

export interface YearStats {
  year: number;
  count: number;
}

export interface CategoryStats {
  category: string;
  count: number;
}

export interface AuthorStats {
  author: string;
  count: number;
  department: string;
}

export interface CollaborationNode {
  id: string;
  group: number;
  val: number;
}

export interface CollaborationLink {
  source: string;
  target: string;
  value: number;
}

export interface NetworkData {
  nodes: CollaborationNode[];
  links: CollaborationLink[];
}

export interface DashboardAnalytics {
  total_papers: number;
  total_authors: number;
  total_departments: number;
  total_emails_processed: number;
  avg_ml_confidence: number;
  by_department: DeptStats[];
  by_year: YearStats[];
  by_category: CategoryStats[];
  top_authors: AuthorStats[];
  collaboration_network: NetworkData;
}

export interface ChatFilters {
  title_keywords: string[];
  authors: string[];
  departments: string[];
  years: number[];
  categories: string[];
  general_query?: string;
}


export interface ChatResponse {
  is_academic_query: boolean;
  rejection_reason?: string;
  filters?: ChatFilters;
  papers: ResearchPaper[];
  response_text: string;
}

