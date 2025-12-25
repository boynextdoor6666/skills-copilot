import { Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { Review } from '../reviews/entities/review.entity';
import { Content } from '../content/entities/content.entity';
export declare class AdminService {
    private users;
    private reviews;
    private content;
    constructor(users: Repository<User>, reviews: Repository<Review>, content: Repository<Content>);
    getDashboardStats(): Promise<{
        users: {
            total: number;
            active: number;
            inactive: number;
            byRole: {
                admins: number;
                critics: number;
                users: number;
            };
        };
        content: {
            total: number;
            byType: {
                movies: number;
                series: number;
                games: number;
            };
        };
        reviews: {
            total: number;
            avgRating: string | number;
            activity: any[];
        };
        system: {
            database: string;
            tmdb: string;
            igdb: string;
            version: string;
        };
    }>;
    getContentStats(): Promise<{
        total: number;
        byType: {
            movies: number;
            series: number;
            games: number;
        };
    }>;
    getReviewStats(): Promise<{
        total: number;
        avgRating: string | number;
        activity: any[];
    }>;
    getAllUsers(role?: UserRole): Promise<User[]>;
    getAllReviews(): Promise<Review[]>;
    deleteReview(id: number): Promise<{
        message: string;
    }>;
    getUserStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
        byRole: {
            admins: number;
            critics: number;
            users: number;
        };
    }>;
    updateUserStatus(userId: number, isActive: boolean): Promise<User>;
    updateUserRole(userId: number, role: UserRole): Promise<User>;
    deleteUser(userId: number): Promise<{
        message: string;
        userId: number;
    }>;
    getTopUsers(limit?: number): Promise<User[]>;
}
