import { Content } from '../../content/entities/content.entity';
import { User } from '../../users/user.entity';
export declare class Review {
    id: number;
    content_id: number;
    movie_id: number;
    user_id: number;
    content: string;
    aspects: Record<string, number>;
    emotions: Record<string, number>;
    rating: number;
    created_at: Date;
    contentEntity: Content;
    user: User;
}
