import { User } from '../../users/user.entity';
import { Achievement } from './achievement.entity';
export declare class UserAchievement {
    id: number;
    user_id: number;
    achievement_id: number;
    user: User;
    achievement: Achievement;
    earned_at: Date;
}
