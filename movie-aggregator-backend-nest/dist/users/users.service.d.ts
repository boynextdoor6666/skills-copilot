import { OnModuleInit } from '@nestjs/common';
import { Repository, Connection } from 'typeorm';
import { User } from './user.entity';
export declare class UsersService implements OnModuleInit {
    private repo;
    private connection;
    constructor(repo: Repository<User>, connection: Connection);
    onModuleInit(): Promise<void>;
    private ensureWatchlistColumns;
    private ensureWatchlistTable;
    addToWatchlist(userId: number, contentId: number): Promise<{
        status: string;
    }>;
    removeFromWatchlist(userId: number, contentId: number): Promise<{
        status: string;
    }>;
    getWatchlist(userId: number): Promise<any>;
    private ensureUserColumns;
    findByUsername(username: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findById(id: number): Promise<User | null>;
    create(data: Partial<User>): Promise<User>;
    updateById(id: number, data: Partial<User>): Promise<User | null>;
    changePassword(id: number, newPassword: string): Promise<User | null>;
}
