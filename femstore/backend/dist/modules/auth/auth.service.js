"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../../config/database");
const encryption_1 = require("../../common/encryption");
// Helper para desencriptar valores que pueden estar encriptados o no
const decryptValue = (value) => {
    if (!value)
        return value;
    return (0, encryption_1.tryDecrypt)(value);
};
class AuthService {
    async register(dto) {
        // El email ya viene encriptado del frontend, lo guardamos directamente encriptado
        // Pero primero necesitamos verificar si ya existe
        // Como el email está encriptado, no podemos hacer búsqueda directa
        // Por ahora permitimos registros duplicados hasta tener índice de búsqueda
        // El password viene encriptado del frontend, necesitamos desencriptarlo antes de hashear
        const decryptedPassword = decryptValue(dto.password) || dto.password;
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(decryptedPassword, 12);
        // Create user with encrypted fields (email y phone ya encriptados, name en texto plano)
        try {
            const result = await (0, database_1.query)(`INSERT INTO users (name, email, password, phone, role)
         VALUES ($1, $2, $3, $4, 'customer')
         RETURNING id, name, email, phone, role, is_active, created_at, updated_at`, [dto.name, dto.email, hashedPassword, dto.phone || null]);
            const user = result.rows[0];
            // Desencriptar para respuesta
            const decryptedUser = {
                ...user,
                name: user.name,
                email: (0, encryption_1.decrypt)(user.email),
                phone: user.phone ? (0, encryption_1.decrypt)(user.phone) : undefined,
            };
            const token = this.generateToken(user);
            return { user: decryptedUser, token };
        }
        catch (error) {
            // PostgreSQL unique violation (error code 23505)
            if (error.code === '23505') {
                throw new Error('Este email ya está registrado');
            }
            throw error;
        }
    }
    async login(dto) {
        // El email llega encriptado desde el frontend, lo desencriptamos para buscar
        const decryptedEmail = decryptValue(dto.email) || dto.email;
        // El password también llega encriptado, desencriptarlo para comparar
        const decryptedPassword = decryptValue(dto.password) || dto.password;
        // Buscar usuario - el email en la DB está encriptado, comparamos con todos
        const result = await (0, database_1.query)('SELECT * FROM users WHERE is_active = TRUE');
        // Encontrar usuario comparando email desencriptado
        const userRow = result.rows.find((row) => {
            const storedEmail = (0, encryption_1.tryDecrypt)(row.email);
            return storedEmail.toLowerCase() === decryptedEmail.toLowerCase();
        });
        if (!userRow) {
            throw new Error('Credenciales inválidas');
        }
        const user = userRow;
        // Check password (usar la password desencriptada del input)
        const isPasswordValid = await bcryptjs_1.default.compare(decryptedPassword, user.password);
        if (!isPasswordValid) {
            throw new Error('Credenciales inválidas');
        }
        // Desencriptar campos sensibles para respuesta
        const { password: _, ...userWithoutPassword } = user;
        const decryptedUser = {
            ...userWithoutPassword,
            name: userWithoutPassword.name,
            email: (0, encryption_1.decrypt)(userWithoutPassword.email),
            phone: userWithoutPassword.phone ? (0, encryption_1.decrypt)(userWithoutPassword.phone) : undefined,
        };
        const token = this.generateToken(user);
        return { user: decryptedUser, token };
    }
    async getProfile(userId) {
        const result = await (0, database_1.query)('SELECT id, name, email, phone, role, is_active, created_at, updated_at FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            throw new Error('Usuario no encontrado');
        }
        const user = result.rows[0];
        // Desencriptar campos sensibles
        return {
            ...user,
            name: user.name,
            email: (0, encryption_1.decrypt)(user.email),
            phone: user.phone ? (0, encryption_1.decrypt)(user.phone) : undefined,
        };
    }
    async updateProfile(userId, data) {
        // Encriptar solo phone, name se guarda en texto plano
        const encryptedPhone = data.phone ? (0, encryption_1.encrypt)(data.phone) : null;
        const result = await (0, database_1.query)(`UPDATE users SET
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        updated_at = NOW()
       WHERE id = $3
       RETURNING id, name, email, phone, role, is_active, created_at, updated_at`, [data.name || null, encryptedPhone, userId]);
        const user = result.rows[0];
        // Desencriptar para respuesta
        return {
            ...user,
            name: user.name,
            email: (0, encryption_1.decrypt)(user.email),
            phone: user.phone ? (0, encryption_1.decrypt)(user.phone) : undefined,
        };
    }
    generateToken(user) {
        // Usar email desencriptado para el token
        const emailInToken = (0, encryption_1.tryDecrypt)(user.email) || user.email;
        const payload = {
            sub: user.id,
            email: emailInToken,
            role: user.role,
        };
        return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET || 'secret', {
            expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        });
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map