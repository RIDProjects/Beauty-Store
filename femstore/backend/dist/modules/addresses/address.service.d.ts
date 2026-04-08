export interface CustomerAddress {
    id: string;
    user_id: string;
    label: string;
    address: string;
    is_default: boolean;
    created_at: string;
}
export declare class AddressService {
    findByUser(userId: string): Promise<CustomerAddress[]>;
    create(userId: string, label: string, address: string, makeDefault: boolean): Promise<CustomerAddress>;
    setDefault(userId: string, addressId: string): Promise<CustomerAddress>;
    delete(userId: string, addressId: string): Promise<void>;
}
//# sourceMappingURL=address.service.d.ts.map