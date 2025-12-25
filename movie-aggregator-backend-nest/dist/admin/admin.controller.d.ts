import { AdminService } from './admin.service';
import { UserRole } from '../users/user.entity';
export declare class AdminController {
    private readonly admin;
    constructor(admin: AdminService);
    getStats(): Promise<{
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
    getAllUsers(role?: UserRole): Promise<import("../users/user.entity").User[]>;
    getTopUsers(limit?: number): Promise<import("../users/user.entity").User[]>;
    getAllReviews(): Promise<import("../reviews/entities/review.entity").Review[]>;
    deleteReview(id: number): Promise<{
        message: string;
    }>;
    updateUserStatus(id: number, isActive: boolean): Promise<import("../users/user.entity").User>;
    updateUserRole(id: number, role: UserRole): Promise<import("../users/user.entity").User>;
    deleteUser(id: number): Promise<{
        message: string;
        userId: number;
    }>;
}
