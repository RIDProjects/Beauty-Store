import { User } from '../../common/types';
export interface RegisterDto {
    name: string;
    email: string;
    password: string;
    phone?: string;
}
export interface LoginDto {
    email: string;
    password: string;
}
export interface AuthResult {
    user: Omit<User, 'password'>;
    token: string;
}
export declare class AuthService {
    register(dto: RegisterDto): Promise<AuthResult>;
    login(dto: LoginDto): Promise<AuthResult>;
    getProfile(userId: string): Promise<Omit<User, 'password'>>;
    updateProfile(userId: string, data: {
        name?: string;
        phone?: string;
    }): Promise<Omit<User, 'password'>>;
    private generateToken;
}
//# sourceMappingURL=auth.service.d.ts.map