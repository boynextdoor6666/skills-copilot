import { CriticsService } from './critics.service';
export declare class CriticsController {
    private readonly criticsService;
    constructor(criticsService: CriticsService);
    getAllCritics(): Promise<any[]>;
    getFollowedCritics(req: any): Promise<any[]>;
    followCritic(req: any, criticId: number): Promise<{
        success: boolean;
        message: string;
    }>;
    unfollowCritic(req: any, criticId: number): Promise<{
        success: boolean;
        message: string;
    }>;
    getPersonalizedRatings(req: any, contentIdsStr: string): Promise<Record<number, {
        personalRating: number | null;
        reviewCount: number;
    }>>;
    getPersonalizedRating(req: any, contentId: number): Promise<{
        personalRating: number | null;
        reviewCount: number;
    }>;
    getAllPublications(): Promise<any>;
    createPublication(data: any): Promise<any>;
    updatePublication(id: number, data: any): Promise<any>;
    deletePublication(id: number): Promise<{
        message: string;
    }>;
}
