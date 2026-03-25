export interface IndexListItem {
  indextype: string;
}

export interface IndexDataResponse {
  d: string; // JSON string that needs to be parsed
}

export interface IndexListResponse {
  d: IndexListItem[];
}

export interface ProcessedIndexData {
  date: Date;
  nav: number;
}