import { Category } from '../../common/types';
export interface CreateCategoryDto {
    name: string;
    description?: string;
    image_url?: string;
}
export declare class CategoryService {
    findAll(activeOnly?: boolean): Promise<Category[]>;
    findById(id: string): Promise<Category | null>;
    create(dto: CreateCategoryDto): Promise<Category>;
    update(id: string, dto: Partial<CreateCategoryDto>): Promise<Category>;
    toggleActive(id: string): Promise<Category>;
    delete(id: string): Promise<void>;
}
//# sourceMappingURL=category.service.d.ts.map