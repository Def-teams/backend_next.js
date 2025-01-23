// src/types/index.ts

export interface User {
    id: string;
    username: string;
    email: string;
    passwordHash: string;
}

export interface AuthToken {
    token: string;
    expiresIn: number;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}