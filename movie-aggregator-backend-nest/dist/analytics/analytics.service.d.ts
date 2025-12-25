import { Connection } from 'typeorm';
export declare class AnalyticsService {
    private connection;
    constructor(connection: Connection);
    getWorldRatings(contentId?: number): Promise<any>;
    getAntiRating(limit?: number): Promise<any>;
    getHypeTop(limit?: number): Promise<any>;
}
