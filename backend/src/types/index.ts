import { Request } from 'express';

export interface AuthRequest extends Request {
    userId?: string;
}

export interface PaginationQuery {
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}