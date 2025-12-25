export declare enum ContentType {
    MOVIE = "MOVIE",
    TV_SERIES = "TV_SERIES",
    GAME = "GAME"
}
export declare class ComingSoonItem {
    id: number;
    title: string;
    content_type: ContentType;
    release_date: Date;
    description: string;
    poster_url: string;
    trailer_url: string;
    expected_score: number;
    genre: string;
    developer: string;
    director: string;
    creator: string;
    studio: string;
    network: string;
    publisher: string;
    platforms: string[];
    watchlist_count: number;
    screenshots: string[];
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
