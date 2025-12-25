import { Publication } from '../critics/entities/publication.entity';
export declare enum UserRole {
    USER = "USER",
    CRITIC = "CRITIC",
    ADMIN = "ADMIN"
}
export declare enum UserLevel {
    NOVICE = "NOVICE",
    ENTHUSIAST = "ENTHUSIAST",
    EXPERT = "EXPERT",
    LEGEND = "LEGEND"
}
export declare class User {
    id: number;
    username: string;
    email: string;
    password: string;
    role: UserRole;
    level: UserLevel;
    registrationDate: Date;
    lastLogin: Date;
    avatarUrl: string;
    bio: string;
    totalReviews: number;
    totalRatings: number;
    reputation: number;
    isActive: boolean;
    isVerified: boolean;
    country: string;
    publication: Publication;
    publicationId: number;
}
