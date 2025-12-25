import { User } from '../../users/user.entity';
import { Content } from '../../content/entities/content.entity';
export declare class Expectation {
    id: number;
    user_id: number;
    content_id: number;
    rating: number;
    created_at: Date;
    user: User;
    content: Content;
}
