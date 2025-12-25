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
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.UserLevel = exports.UserRole = void 0;
const typeorm_1 = require("typeorm");
const publication_entity_1 = require("../critics/entities/publication.entity");
var UserRole;
(function (UserRole) {
    UserRole["USER"] = "USER";
    UserRole["CRITIC"] = "CRITIC";
    UserRole["ADMIN"] = "ADMIN";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserLevel;
(function (UserLevel) {
    UserLevel["NOVICE"] = "NOVICE";
    UserLevel["ENTHUSIAST"] = "ENTHUSIAST";
    UserLevel["EXPERT"] = "EXPERT";
    UserLevel["LEGEND"] = "LEGEND";
})(UserLevel || (exports.UserLevel = UserLevel = {}));
let User = class User {
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, length: 50 }),
    __metadata("design:type", String)
], User.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, length: 100 }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: UserRole, default: UserRole.USER }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: UserLevel, default: UserLevel.NOVICE }),
    __metadata("design:type", String)
], User.prototype, "level", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'registration_date', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], User.prototype, "registrationDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_login', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], User.prototype, "lastLogin", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'avatar_url', length: 500, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "avatarUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "bio", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_reviews', default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "totalReviews", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_ratings', default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "totalRatings", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "reputation", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], User.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_verified', default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "isVerified", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "country", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => publication_entity_1.Publication, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'publication_id' }),
    __metadata("design:type", publication_entity_1.Publication)
], User.prototype, "publication", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'publication_id', nullable: true }),
    __metadata("design:type", Number)
], User.prototype, "publicationId", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('users')
], User);
//# sourceMappingURL=user.entity.js.map