import { Response } from 'express';
import { Pagination } from './types';
export declare const sendSuccess: <T>(res: Response, data: T, message?: string, statusCode?: number, pagination?: Pagination) => Response;
export declare const sendError: (res: Response, error: string, statusCode?: number) => Response;
export declare const generateOrderNumber: () => string;
export declare const slugify: (text: string) => string;
export declare const paginate: (page?: number, limit?: number) => {
    page: number;
    limit: number;
    offset: number;
};
//# sourceMappingURL=helpers.d.ts.map