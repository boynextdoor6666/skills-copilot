import { Repository } from 'typeorm';
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';
import { User } from '../users/user.entity';
export declare class GamificationService {
    private achievementRepository;
    private userAchievementRepository;
    private userRepository;
    constructor(achievementRepository: Repository<Achievement>, userAchievementRepository: Repository<UserAchievement>, userRepository: Repository<User>);
    onModuleInit(): Promise<void>;
    private ensureAchievementsSchema;
    seedAchievements(): Promise<void>;
    getUserAchievements(userId: number): Promise<{
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
    getAllAchievements(): Promise<Achievement[]>;
    createAchievement(data: Partial<Achievement>): Promise<Achievement>;
    updateAchievement(id: number, data: Partial<Achievement>): Promise<Achievement | null>;
    deleteAchievement(id: number): Promise<import("typeorm").DeleteResult>;
    getLeaderboard(limit?: number): Promise<{
        userId: number;
        username: string;
        rank: number;
        xp: number;
        reviewCount: number;
        avgRating: number;
    }[]>;
    getUserLevel(userId: number): Promise<{
        level: number;
        title: string;
        currentXP: number;
        nextLevelXP: number;
    } | null>;
    awardXp(userId: number, amount: number): Promise<User | undefined>;
    checkAndAward(userId: number, trigger: string, value: number): Promise<Achievement[]>;
}
