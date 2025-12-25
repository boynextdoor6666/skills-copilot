import { User } from '../../users/user.entity';
import { Content } from '../../content/entities/content.entity';
export declare class Recommendation {
    id: number;
    user_id: number;
    content_id: number;
    score: number;
    reason: string;
    user: User;
    content: Content;
}
