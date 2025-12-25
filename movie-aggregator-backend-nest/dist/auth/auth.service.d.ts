import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
export declare class AuthService {
    private readonly jwt;
    private readonly users;
    constructor(jwt: JwtService, users: Repository<User>);
    validateUser(usernameOrEmail: string, pass: string): Promise<User>;
    login(user: User): Promise<{
        token: string;
        user: {
            id: number;
            username: string;
            email: string;
            role: import("../users/user.entity").UserRole;
            level: import("../users/user.entity").UserLevel;
            totalReviews: number;
            totalRatings: number;
            reputation: number;
            avatarUrl: string;
            bio: string;
            country: string;
        };
    }>;
    findById(id: number): Promise<User | null>;
    register(data: Partial<User>): Promise<{
        token: string;
        user: {
            id: number;
            username: string;
            email: string;
            role: import("../users/user.entity").UserRole;
            level: import("../users/user.entity").UserLevel;
            totalReviews: number;
            totalRatings: number;
            reputation: number;
            avatarUrl: string;
            bio: string;
            country: string;
        };
    }>;
}
