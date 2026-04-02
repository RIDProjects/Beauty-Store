"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginate = exports.slugify = exports.generateOrderNumber = exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, data, message, statusCode = 200, pagination) => {
    const response = {
        success: true,
        data,
        message,
        pagination,
    };
    return res.status(statusCode).json(response);
};
exports.sendSuccess = sendSuccess;
const sendError = (res, error, statusCode = 400) => {
    const response = {
        success: false,
        error,
    };
    return res.status(statusCode).json(response);
};
exports.sendError = sendError;
const generateOrderNumber = () => {
    const prefix = 'FS';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
};
exports.generateOrderNumber = generateOrderNumber;
const slugify = (text) => {
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
exports.slugify = slugify;
const paginate = (page = 1, limit = 12) => {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const offset = (safePage - 1) * safeLimit;
    return { page: safePage, limit: safeLimit, offset };
};
exports.paginate = paginate;
//# sourceMappingURL=helpers.js.map