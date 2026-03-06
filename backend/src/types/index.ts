import { Request } from 'express';

export interface AuthRequest extends Request {
    userId?: string;
    body: any;
    query: any;
    headers: any;
}

export interface PaginationQuery {
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}