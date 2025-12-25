import { ContentType } from '../entities/content.entity';
export declare class CreateContentDto {
    title: string;
    content_type: ContentType;
    release_year?: number;
    genre?: string;
    description?: string;
    poster_url?: string;
    trailer_url?: string;
    director?: string;
    cast?: string;
    director_photo_url?: string;
    cast_photos?: string[];
    runtime?: number;
    developer?: string;
    publisher?: string;
    platforms?: string;
    esrb_rating?: string;
    players?: string;
    file_size?: string;
    technical_info?: any;
}
export declare class UpdateContentDto {
    title?: string;
    release_year?: number;
    genre?: string;
    description?: string;
    poster_url?: string;
    trailer_url?: string;
    director?: string;
    cast?: string;
    director_photo_url?: string;
    cast_photos?: string[];
    runtime?: number;
    developer?: string;
    publisher?: string;
    platforms?: string;
    esrb_rating?: string;
    players?: string;
    file_size?: string;
    technical_info?: any;
}
export declare class SearchContentDto {
    query?: string;
    content_type?: ContentType;
    limit?: number;
}
