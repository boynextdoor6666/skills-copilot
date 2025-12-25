import { Connection } from 'typeorm';
export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    category: 'reviews' | 'critics' | 'diversity' | 'engagement' | 'special';
    requirement: number;
    unlockedAt?: Date;
    progress?: number;
}
export declare class GamificationService {
    private readonly conn;
    private readonly logger;
    constructor(conn: Connection);
    private achievements;
    getUserLevel(userId: number): Promise<{
        level: number;
        currentXP: number;
        nextLevelXP: number;
        title: string;
    }>;
    getUserAchievements(userId: number): Promise<Achievement[]>;
    getLeaderboard(limit?: number): Promise<any[]>;
}
