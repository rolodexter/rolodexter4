export interface SearchResult {
  title: string;
  path: string;
  excerpt: string;
  rank: number;
}

export interface DocumentMetadata {
  excerpt?: string;
  rank?: number;
  [key: string]: any;
}
