import pool from '../database/database';
import speakeasy from 'speakeasy';
import bcrypt from 'bcrypt';

export interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    phone: string;
    email_verified: boolean;
    phone_verified: boolean;
    otp: string;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

export async function createUser(user: User): Promise<User> {
    const otp = speakeasy.totp({
        secret: speakeasy.generateSecret().base32,
        encoding: 'base32',
        digits: 6,
        step: 300 // 5 minute interval
    });
    const { rows } = await pool.query<User>(
        'SELECT * FROM users WHERE email = $1 OR phone = $2',
        [user.email, user.phone]
    );
    if (rows.length > 0) {
        // email or phone already exists
        throw new Error('Email or phone number already exists');
    }

    const hashedPassword = await bcrypt.hash(user.password, 10);

    const { rows: insertedRows } = await pool.query<User>(
        'INSERT INTO users (first_name, last_name, email, password, phone, email_verified, phone_verified, otp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [user.first_name, user.last_name, user.email, hashedPassword, user.phone, false, false, otp],
    );
    return insertedRows[0];
}


export async function getUserByEmailOrPhone(emailOrPhone: string): Promise<User | null> {
    const { rows } = await pool.query<User>('SELECT * FROM users WHERE email = $1 OR phone = $1', [emailOrPhone]);
    return rows[0] || null;
}

export async function getUserById(id: number): Promise<User | null> {
    const { rows } = await pool.query<User>('SELECT * FROM users WHERE id = $1 AND is_deleted IS false', [id]);
    return rows[0] || null;
}


export async function updateUser(user: User): Promise<User> {
    const { rows } = await pool.query<User>(
        'UPDATE users SET first_name = $2, last_name = $3, email = $4, phone = $5, email_verified = $6, phone_verified = $7, otp = $8 WHERE id = $1 RETURNING *',
        [user.id, user.first_name, user.last_name, user.email, user.phone, user.email_verified, user.phone_verified, user.otp],
    );
    return rows[0];
}

export async function patchUser(user: User): Promise<User> {
    const existingUser = await getUserById(user.id);
    const fieldsToUpdate = {
        first_name: user.first_name !== undefined ? user.first_name : existingUser.first_name,
        last_name: user.last_name !== undefined ? user.last_name : existingUser.last_name,
        email: user.email !== undefined ? user.email : existingUser.email,
        phone: user.phone !== undefined ? user.phone : existingUser.phone,
        email_verified: user.email_verified !== undefined ? user.email_verified : existingUser.email_verified,
        phone_verified: user.phone_verified !== undefined ? user.phone_verified : existingUser.phone_verified,
        otp: user.otp !== undefined ? user.otp : existingUser.otp,
    };
    const { rows } = await pool.query<User>(
        'UPDATE users SET first_name = $2, last_name = $3, email = $4, phone = $5, email_verified = $6, phone_verified = $7, otp = $8 WHERE id = $1 RETURNING *',
        [user.id, fieldsToUpdate.first_name, fieldsToUpdate.last_name, fieldsToUpdate.email, fieldsToUpdate.phone, fieldsToUpdate.email_verified, fieldsToUpdate.phone_verified, fieldsToUpdate.otp],
    );
    return rows[0];
}

export async function deleteUser(id: number): Promise<boolean> {
    const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1 AND is_deleted IS false', [id]);
    return rowCount > 0;
}

