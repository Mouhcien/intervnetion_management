export interface User {
  id: number;
  username: string;
}

export interface Category {
  id: number;
  title: string;
}

export interface Period {
  id: number;
  title: string;
}

export interface Intervention {
  id: number;
  user_id: number;
  category_id: number;
  period_id: number;
  object: string;
  intervention_date: string;
  user_name?: string;
  category_title?: string;
  period_title?: string;
}
