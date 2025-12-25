import { OnModuleInit } from '@nestjs/common';
import { Connection } from 'typeorm';
export declare class CriticsService implements OnModuleInit {
    private readonly conn;
    private readonly logger;
    constructor(conn: Connection);
    onModuleInit(): Promise<void>;
    private ensurePublicationsSchema;
    private ensureCriticsSchema;
    getAllCritics(): Promise<any[]>;
    getFollowedCritics(userId: number): Promise<any[]>;
    followCritic(userId: number, criticId: number): Promise<{
        success: boolean;
        message: string;
    }>;
    unfollowCritic(userId: number, criticId: number): Promise<{
        success: boolean;
        message: string;
    }>;
    getPersonalizedRating(userId: number, contentId: number): Promise<{
        personalRating: number | null;
        reviewCount: number;
    }>;
    getPersonalizedRatings(userId: number, contentIds: number[]): Promise<Record<number, {
        personalRating: number | null;
        reviewCount: number;
    }>>;
    getAllPublications(): Promise<any>;
    createPublication(data: any): Promise<any>;
    updatePublication(id: number, data: any): Promise<any>;
    deletePublication(id: number): Promise<{
        message: string;
    }>;
}
