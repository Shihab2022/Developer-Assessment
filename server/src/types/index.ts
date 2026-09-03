import { JwtPayload } from "jsonwebtoken";

export interface IAuthUser extends JwtPayload {
  id: string;
  name: string;
  email: string;
  role: "CANDIDATE" | "RECRUITER" | "ADMIN";
  companyId?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  meta?: PaginationMeta;
  data: T;
}

export interface ValidationErrorItem {
  field: string;
  message: string;
}