export declare enum ContentType {
    MOVIE = "MOVIE",
    TV_SERIES = "TV_SERIES",
    GAME = "GAME"
}
export declare class Content {
    id: number;
    title: string;
    content_type: ContentType;
    release_year: number;
    genre: string;
    description: string;
    avg_rating: number;
    critics_rating: number;
    audience_rating: number;
    hype_index: number;
    reviews_count: number;
    positive_reviews: number;
    mixed_reviews: number;
    negative_reviews: number;
    emotional_cloud: Record<string, number>;
    perception_map: Record<string, number>;
    poster_url: string;
    trailer_url: string;
    director: string;
    cast: string;
    director_photo_url: string;
    cast_photos: string[] | null;
    runtime: number;
    developer: string;
    publisher: string;
    platforms: string[] | null;
    esrb_rating: string;
    players: string;
    file_size: string;
    technical_info: any;
    created_at: Date;
    updated_at: Date;
}
