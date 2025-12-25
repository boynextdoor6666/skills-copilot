import { GamificationService } from './gamification.service';
export declare class GamificationController {
    private readonly gamificationService;
    constructor(gamificationService: GamificationService);
    getMyAchievements(req: any): Promise<{
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
    getUserAchievements(id: string): Promise<{
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
    getAllAchievements(): Promise<import("./entities/achievement.entity").Achievement[]>;
    createAchievement(data: any): Promise<import("./entities/achievement.entity").Achievement>;
    updateAchievement(id: number, data: any): Promise<import("./entities/achievement.entity").Achievement | null>;
    deleteAchievement(id: number): Promise<import("typeorm").DeleteResult>;
}
