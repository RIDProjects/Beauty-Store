import { Product, Pagination } from '../../common/types';
export interface CreateProductDto {
    name: string;
    description?: string;
    price: number;
    sale_price?: number | null;
    is_on_sale?: boolean;
    stock?: number;
    category_id?: string;
    is_active?: boolean;
}
export interface ProductFilters {
    category_id?: string;
    is_active?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
}
export interface ProductsResult {
    products: Product[];
    pagination: Pagination;
}
export declare class ProductService {
    findAll(filters?: ProductFilters): Promise<ProductsResult>;
    findById(id: string): Promise<Product | null>;
    findBySlug(slug: string): Promise<Product | null>;
    create(dto: CreateProductDto): Promise<Product>;
    update(id: string, dto: Partial<CreateProductDto>): Promise<Product>;
    toggleActive(id: string): Promise<Product>;
    delete(id: string): Promise<void>;
    addImage(productId: string, url: string, isPrimary?: boolean): Promise<void>;
    removeImage(imageId: string): Promise<void>;
    setPrimaryImage(productId: string, imageId: string): Promise<void>;
}
//# sourceMappingURL=product.service.d.ts.map