"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const users_service_1 = require("./users.service");
const gamification_service_1 = require("../gamification/gamification.service");
const taste_profile_service_1 = require("./taste-profile.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
class UpdateProfileDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "username", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)(o => o.email && o.email.length > 0),
    (0, class_validator_1.IsEmail)({}, { message: 'Некорректный email' }),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], UpdateProfileDto.prototype, "avatarUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], UpdateProfileDto.prototype, "bio", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], UpdateProfileDto.prototype, "country", void 0);
class ChangePasswordDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "currentPassword", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "newPassword", void 0);
let UsersController = class UsersController {
    constructor(users, gamification, tasteProfile) {
        this.users = users;
        this.gamification = gamification;
        this.tasteProfile = tasteProfile;
    }
    async me(req) {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            throw new common_1.UnauthorizedException();
        const user = await this.users.findById(userId);
        if (!user)
            throw new common_1.UnauthorizedException();
        return user;
    }
    async updateMe(req, dto) {
        var _a;
        console.log('updateMe called with dto:', JSON.stringify(dto));
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        console.log('userId from token:', userId);
        if (!userId)
            throw new common_1.UnauthorizedException();
        const payload = {};
        if (typeof dto.username === 'string' && dto.username.trim())
            payload.username = dto.username.trim();
        if (typeof dto.email === 'string' && dto.email.trim())
            payload.email = dto.email.trim();
        if (typeof dto.avatarUrl === 'string') {
            const v = dto.avatarUrl.trim();
            if (v.length === 0)
                payload.avatarUrl = null;
            else
                payload.avatarUrl = v;
        }
        if (typeof dto.bio === 'string') {
            const v = dto.bio.trim();
            payload.bio = v.length === 0 ? null : v;
        }
        if (typeof dto.country === 'string') {
            const v = dto.country.trim();
            payload.country = v.length === 0 ? null : v;
        }
        return this.users.updateById(userId, payload);
    }
    async changePassword(req, dto) {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            throw new common_1.UnauthorizedException();
        const user = await this.users.findById(userId);
        if (!user)
            throw new common_1.BadRequestException('User not found');
        if (!dto.currentPassword || !dto.newPassword) {
            throw new common_1.BadRequestException('Current and new passwords are required');
        }
        const bcrypt = require('bcrypt');
        const ok = await bcrypt.compare(String(dto.currentPassword), String(user.password || ''));
        if (!ok) {
            throw new common_1.UnauthorizedException('Current password is incorrect');
        }
        await this.users.changePassword(userId, dto.newPassword);
        return { message: 'Password changed successfully' };
    }
    findOne(username) {
        return this.users.findByUsername(username);
    }
    async getMyLevel(req) {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            throw new common_1.UnauthorizedException();
        return this.gamification.getUserLevel(userId);
    }
    async getMyAchievements(req) {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            throw new common_1.UnauthorizedException();
        return this.gamification.getUserAchievements(userId);
    }
    async getLeaderboard() {
        return this.gamification.getLeaderboard(10);
    }
    async getMyTasteProfile(req) {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            throw new common_1.UnauthorizedException();
        return this.tasteProfile.getUserTasteProfile(userId);
    }
    async getMyRecommendations(req, limit) {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            throw new common_1.UnauthorizedException();
        return this.tasteProfile.getPersonalizedRecommendations(userId, limit || 10);
    }
    async getMyWatchlist(req) {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            throw new common_1.UnauthorizedException();
        return this.users.getWatchlist(userId);
    }
    async addToWatchlist(req, contentId) {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            throw new common_1.UnauthorizedException();
        return this.users.addToWatchlist(userId, contentId);
    }
    async removeFromWatchlist(req, contentId) {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            throw new common_1.UnauthorizedException();
        return this.users.removeFromWatchlist(userId, contentId);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "me", null);
__decorate([
    (0, common_1.Patch)('me'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, UpdateProfileDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateMe", null);
__decorate([
    (0, common_1.Patch)('me/password'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ChangePasswordDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Get)('by-username/:username'),
    __param(0, (0, common_1.Param)('username')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('me/level'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getMyLevel", null);
__decorate([
    (0, common_1.Get)('me/achievements'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getMyAchievements", null);
__decorate([
    (0, common_1.Get)('leaderboard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getLeaderboard", null);
__decorate([
    (0, common_1.Get)('me/taste-profile'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getMyTasteProfile", null);
__decorate([
    (0, common_1.Get)('me/recommendations'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('limit', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getMyRecommendations", null);
__decorate([
    (0, common_1.Get)('me/watchlist'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getMyWatchlist", null);
__decorate([
    (0, common_1.Post)('me/watchlist/:contentId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('contentId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "addToWatchlist", null);
__decorate([
    (0, common_1.Delete)('me/watchlist/:contentId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('contentId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "removeFromWatchlist", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('users'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('api/users'),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        gamification_service_1.GamificationService,
        taste_profile_service_1.TasteProfileService])
], UsersController);
//# sourceMappingURL=users.controller.js.map