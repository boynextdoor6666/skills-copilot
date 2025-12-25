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
exports.ContentController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../admin/roles.guard");
const roles_decorator_1 = require("../admin/roles.decorator");
const content_service_1 = require("./content.service");
const content_dto_1 = require("./dto/content.dto");
const content_entity_1 = require("./entities/content.entity");
const user_entity_1 = require("../users/user.entity");
let ContentController = class ContentController {
    constructor(contentService) {
        this.contentService = contentService;
    }
    async searchContent(searchDto) {
        return this.contentService.searchContent(searchDto);
    }
    async autocomplete(query, limit) {
        return this.contentService.autocomplete(query, limit || 10);
    }
    async getAllContent(type, limit) {
        return this.contentService.getAllContent(type, limit || 50);
    }
    async getContentStats() {
        return this.contentService.getContentStats();
    }
    async getGlobalCountryStats() {
        return this.contentService.getGlobalCountryStats();
    }
    async getCountryRatingsStats() {
        const countryStats = await this.contentService.getGlobalCountryStats();
        const totalCountries = countryStats.length;
        const totalRatings = countryStats.reduce((sum, c) => sum + c.reviewsCount, 0);
        const activeUsers = countryStats.reduce((sum, c) => sum + c.usersCount, 0);
        const allRatings = countryStats.map(c => c.avgRating);
        const globalAvg = allRatings.length > 0 ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length : 0;
        const avgDifference = allRatings.length > 0
            ? allRatings.reduce((sum, r) => sum + Math.abs(r - globalAvg), 0) / allRatings.length
            : 0;
        return {
            totalCountries,
            totalRatings,
            activeUsers,
            avgDifference: parseFloat(avgDifference.toFixed(2)),
            countries: countryStats,
        };
    }
    async getEmotionalCloud(id) {
        return this.contentService.getEmotionalCloud(id);
    }
    async getPerceptionMap(id) {
        return this.contentService.getPerceptionMap(id);
    }
    async getDynamicsGraph(id) {
        return this.contentService.getDynamicsGraph(id);
    }
    async getCountryRatings(id) {
        return this.contentService.getCountryRatings(id);
    }
    async getContentById(id) {
        return this.contentService.getContentById(id);
    }
    async createContent(createDto) {
        return this.contentService.createContent(createDto);
    }
    async updateContent(id, updateDto, req) {
        return this.contentService.updateContent(id, updateDto, req.user.userId);
    }
    async deleteContent(id) {
        return this.contentService.deleteContent(id);
    }
    async getActiveHeroCarousel(sort) {
        return this.contentService.getActiveHeroCarousel(sort);
    }
    async getAllHeroCarousel() {
        return this.contentService.getAllHeroCarousel();
    }
    async createHeroCarousel(data) {
        return this.contentService.createHeroCarousel(data);
    }
    async updateHeroCarousel(id, data) {
        return this.contentService.updateHeroCarousel(id, data);
    }
    async deleteHeroCarousel(id) {
        return this.contentService.deleteHeroCarousel(id);
    }
    async getActiveComingSoon() {
        return this.contentService.getActiveComingSoon();
    }
    async getAllComingSoon() {
        return this.contentService.getAllComingSoon();
    }
    async createComingSoon(data) {
        return this.contentService.createComingSoon(data);
    }
    async updateComingSoon(id, data) {
        return this.contentService.updateComingSoon(id, data);
    }
    async deleteComingSoon(id) {
        return this.contentService.deleteComingSoon(id);
    }
};
exports.ContentController = ContentController;
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [content_dto_1.SearchContentDto]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "searchContent", null);
__decorate([
    (0, common_1.Get)('autocomplete'),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "autocomplete", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('type')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getAllContent", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getContentStats", null);
__decorate([
    (0, common_1.Get)('country-stats/global'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getGlobalCountryStats", null);
__decorate([
    (0, common_1.Get)('country-ratings/stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getCountryRatingsStats", null);
__decorate([
    (0, common_1.Get)(':id/emotional-cloud'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getEmotionalCloud", null);
__decorate([
    (0, common_1.Get)(':id/perception-map'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getPerceptionMap", null);
__decorate([
    (0, common_1.Get)(':id/dynamics'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getDynamicsGraph", null);
__decorate([
    (0, common_1.Get)(':id/country-ratings'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getCountryRatings", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getContentById", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [content_dto_1.CreateContentDto]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "createContent", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, content_dto_1.UpdateContentDto, Object]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "updateContent", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "deleteContent", null);
__decorate([
    (0, common_1.Get)('hero-carousel/active'),
    __param(0, (0, common_1.Query)('sort')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getActiveHeroCarousel", null);
__decorate([
    (0, common_1.Get)('hero-carousel/all'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getAllHeroCarousel", null);
__decorate([
    (0, common_1.Post)('hero-carousel'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "createHeroCarousel", null);
__decorate([
    (0, common_1.Put)('hero-carousel/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "updateHeroCarousel", null);
__decorate([
    (0, common_1.Delete)('hero-carousel/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "deleteHeroCarousel", null);
__decorate([
    (0, common_1.Get)('coming-soon/active'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getActiveComingSoon", null);
__decorate([
    (0, common_1.Get)('coming-soon/all'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getAllComingSoon", null);
__decorate([
    (0, common_1.Post)('coming-soon'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "createComingSoon", null);
__decorate([
    (0, common_1.Put)('coming-soon/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "updateComingSoon", null);
__decorate([
    (0, common_1.Delete)('coming-soon/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "deleteComingSoon", null);
exports.ContentController = ContentController = __decorate([
    (0, common_1.Controller)('api/content'),
    __metadata("design:paramtypes", [content_service_1.ContentService])
], ContentController);
//# sourceMappingURL=content.controller.js.map