export interface Pagination {
  page: number;
  limit: number;
}

export interface Page<T> extends Pagination {
  items: T[];
  totalItems: number;
}
