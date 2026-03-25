import { Response } from 'express';
import { ApiResponse, Pagination } from './types';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
  pagination?: Pagination
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    pagination,
  };
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  error: string,
  statusCode = 400
): Response => {
  const response: ApiResponse = {
    success: false,
    error,
  };
  return res.status(statusCode).json(response);
};

export const generateOrderNumber = (): string => {
  const prefix = 'FS';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

export const paginate = (page = 1, limit = 12) => {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));
  const offset = (safePage - 1) * safeLimit;
  return { page: safePage, limit: safeLimit, offset };
};
