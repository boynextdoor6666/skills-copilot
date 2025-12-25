import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { GamificationModule } from '../gamification/gamification.module';
import { TasteProfileService } from './taste-profile.service';
import { UsersController } from './users.controller';
import { User } from './user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    GamificationModule
  ],
  controllers: [UsersController],
  providers: [UsersService, TasteProfileService],
  exports: [UsersService, TasteProfileService],
})
export class UsersModule {}
