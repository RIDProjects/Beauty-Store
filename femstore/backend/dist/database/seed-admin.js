"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("../config/database");
async function createAdmin() {
    const email = 'admin@vainybliss.com';
    const password = 'Admin123!';
    const name = 'Admin Vainy Bliss';
    // Generar hash
    const hashedPassword = await bcryptjs_1.default.hash(password, 12);
    console.log('Creando admin...', { email, name });
    try {
        // Verificar si ya existe
        const existing = await (0, database_1.query)('SELECT id FROM public.users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            // Actualizar password y role
            await (0, database_1.query)('UPDATE public.users SET password = $1, role = $2 WHERE email = $3', [hashedPassword, 'admin', email]);
            console.log('✅ Admin actualizado');
        }
        else {
            // Crear nuevo
            await (0, database_1.query)(`INSERT INTO public.users (name, email, password, role)
         VALUES ($1, $2, $3, $4)`, [name, email, hashedPassword, 'admin']);
            console.log('✅ Admin creado');
        }
        // También crear usuario de prueba
        const customerEmail = 'maria@test.com';
        const customerPassword = 'Customer123!';
        const customerHashed = await bcryptjs_1.default.hash(customerPassword, 12);
        const customerExisting = await (0, database_1.query)('SELECT id FROM public.users WHERE email = $1', [customerEmail]);
        if (customerExisting.rows.length === 0) {
            await (0, database_1.query)(`INSERT INTO public.users (name, email, password, role)
         VALUES ($1, $2, $3, $4)`, ['Maria Rodriguez', customerEmail, customerHashed, 'customer']);
            console.log('✅ Usuario de prueba creado: maria@test.com / Customer123!');
        }
        console.log('\n=== CREDENCIALES ===');
        console.log('Usuario: maria@test.com / Customer123!');
    }
    catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
    process.exit(0);
}
createAdmin();
//# sourceMappingURL=seed-admin.js.map