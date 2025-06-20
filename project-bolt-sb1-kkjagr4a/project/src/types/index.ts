export interface TableCell {
  id: string;
  value: number;
  row: number;
  col: number;
}

export interface TableData {
  headers: string[];
  rows: TableCell[][];
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export interface FilterCriteria {
  column: number;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number;
}

export interface SortConfig {
  column: number;
  direction: 'asc' | 'desc';
}