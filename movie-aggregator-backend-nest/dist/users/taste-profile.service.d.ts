import { Connection } from 'typeorm';
export interface TasteProfile {
    userId: number;
    favoriteGenres: Array<{
        genre: string;
        count: number;
        avgRating: number;
    }>;
    favoriteAspects: {
        [key: string]: number;
    };
    dominantEmotions: Array<{
        emotion: string;
        intensity: number;
        count: number;
    }>;
    preferredContentTypes: Array<{
        type: string;
        count: number;
        avgRating: number;
    }>;
    ratingTendency: {
        average: number;
        min: number;
        max: number;
        distribution: {
            harsh: number;
            balanced: number;
            generous: number;
        };
    };
    totalReviews: number;
}
export interface Recommendation {
    contentId: number;
    title: string;
    contentType: string;
    genre: string;
    avgRating: number;
    matchScore: number;
    matchReasons: string[];
    posterUrl?: string;
    releaseYear?: number;
}
export declare class TasteProfileService {
    private readonly conn;
    private readonly logger;
    constructor(conn: Connection);
    getUserTasteProfile(userId: number): Promise<TasteProfile>;
    getPersonalizedRecommendations(userId: number, limit?: number): Promise<Recommendation[]>;
}
