import { Request } from 'express';
import { AuthService } from './auth.service';
import { UserRole } from '../users/user.entity';
declare class LoginDto {
    usernameOrEmail: string;
    password: string;
}
declare class RegisterDto {
    username: string;
    email: string;
    password: string;
    role: UserRole;
}
export declare class AuthController {
    private readonly auth;
    private readonly logger;
    constructor(auth: AuthService);
    login(dto: LoginDto): Promise<{
        token: string;
        user: {
            id: number;
            username: string;
            email: string;
            role: UserRole;
            level: import("../users/user.entity").UserLevel;
            totalReviews: number;
            totalRatings: number;
            reputation: number;
            avatarUrl: string;
            bio: string;
            country: string;
        };
    }>;
    register(dto: RegisterDto): Promise<{
        token: string;
        user: {
            id: number;
            username: string;
            email: string;
            role: UserRole;
            level: import("../users/user.entity").UserLevel;
            totalReviews: number;
            totalRatings: number;
            reputation: number;
            avatarUrl: string;
            bio: string;
            country: string;
        };
    }>;
    validate(req: Request): Promise<Express.User | undefined>;
}
export {};
