export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  color?: string;
  textColor?: string;
  fontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl';
  isPinned?: boolean;
  isFavorite?: boolean;
  isArchived?: boolean;
  showToolbar?: boolean;
  category?: string;
  reminder?: string; // ISO date string
  isReadMode?: boolean;
}

export interface AppSettings {
  autoSave: boolean;
}
