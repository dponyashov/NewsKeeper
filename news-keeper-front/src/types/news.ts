import { type JSONContent } from "@tiptap/react";

export interface NewsDto {
  id: number;
  title: string;
  coverUrl: string | null;
  content?: JSONContent | null;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number; // Текущая страница (0-based)
  size: number;
  first: boolean;
  last: boolean;
}
