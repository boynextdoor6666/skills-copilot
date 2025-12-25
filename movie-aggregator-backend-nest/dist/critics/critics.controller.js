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
exports.CriticsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../admin/roles.guard");
const roles_decorator_1 = require("../admin/roles.decorator");
const user_entity_1 = require("../users/user.entity");
const critics_service_1 = require("./critics.service");
let CriticsController = class CriticsController {
    constructor(criticsService) {
        this.criticsService = criticsService;
    }
    async getAllCritics() {
        return this.criticsService.getAllCritics();
    }
    async getFollowedCritics(req) {
        return this.criticsService.getFollowedCritics(req.user.userId);
    }
    async followCritic(req, criticId) {
        return this.criticsService.followCritic(req.user.userId, criticId);
    }
    async unfollowCritic(req, criticId) {
        return this.criticsService.unfollowCritic(req.user.userId, criticId);
    }
    async getPersonalizedRatings(req, contentIdsStr) {
        if (!contentIdsStr) {
            return {};
        }
        const contentIds = contentIdsStr.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
        return this.criticsService.getPersonalizedRatings(req.user.userId, contentIds);
    }
    async getPersonalizedRating(req, contentId) {
        return this.criticsService.getPersonalizedRating(req.user.userId, contentId);
    }
    async getAllPublications() {
        return this.criticsService.getAllPublications();
    }
    async createPublication(data) {
        return this.criticsService.createPublication(data);
    }
    async updatePublication(id, data) {
        return this.criticsService.updatePublication(id, data);
    }
    async deletePublication(id) {
        return this.criticsService.deletePublication(id);
    }
};
exports.CriticsController = CriticsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CriticsController.prototype, "getAllCritics", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('followed'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CriticsController.prototype, "getFollowedCritics", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':id/follow'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], CriticsController.prototype, "followCritic", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(':id/follow'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], CriticsController.prototype, "unfollowCritic", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('personalized'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('contentIds')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CriticsController.prototype, "getPersonalizedRatings", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('personalized/:contentId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('contentId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], CriticsController.prototype, "getPersonalizedRating", null);
__decorate([
    (0, common_1.Get)('publications/all'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CriticsController.prototype, "getAllPublications", null);
__decorate([
    (0, common_1.Post)('publications'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CriticsController.prototype, "createPublication", null);
__decorate([
    (0, common_1.Put)('publications/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], CriticsController.prototype, "updatePublication", null);
__decorate([
    (0, common_1.Delete)('publications/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CriticsController.prototype, "deletePublication", null);
exports.CriticsController = CriticsController = __decorate([
    (0, common_1.Controller)('api/critics'),
    __metadata("design:paramtypes", [critics_service_1.CriticsService])
], CriticsController);
//# sourceMappingURL=critics.controller.js.map