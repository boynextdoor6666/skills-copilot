import { UsersService } from './users.service';
import { GamificationService } from '../gamification/gamification.service';
import { TasteProfileService } from './taste-profile.service';
import { Request } from 'express';
declare class UpdateProfileDto {
    username?: string;
    email?: string;
    avatarUrl?: string | null;
    bio?: string | null;
    country?: string | null;
}
declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
export declare class UsersController {
    private readonly users;
    private readonly gamification;
    private readonly tasteProfile;
    constructor(users: UsersService, gamification: GamificationService, tasteProfile: TasteProfileService);
    me(req: Request): Promise<import("./user.entity").User>;
    updateMe(req: Request, dto: UpdateProfileDto): Promise<import("./user.entity").User | null>;
    changePassword(req: Request, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    findOne(username: string): Promise<import("./user.entity").User | null>;
    getMyLevel(req: Request): Promise<{
        level: number;
        title: string;
        currentXP: number;
        nextLevelXP: number;
    } | null>;
    getMyAchievements(req: Request): Promise<{
        id: number;
        title: string;
        description: string;
        icon: string;
        category: string;
        xp: number;
        unlockedAt: Date | undefined;
        progress: number;
        requirement: number;
    }[]>;
    getLeaderboard(): Promise<{
        userId: number;
        username: string;
        rank: number;
        xp: number;
        reviewCount: number;
        avgRating: number;
    }[]>;
    getMyTasteProfile(req: Request): Promise<import("./taste-profile.service").TasteProfile>;
    getMyRecommendations(req: Request, limit?: number): Promise<import("./taste-profile.service").Recommendation[]>;
    getMyWatchlist(req: Request): Promise<any>;
    addToWatchlist(req: Request, contentId: number): Promise<{
        status: string;
    }>;
    removeFromWatchlist(req: Request, contentId: number): Promise<{
        status: string;
    }>;
}
export {};
