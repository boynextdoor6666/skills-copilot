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
exports.HeroCarousel = void 0;
const typeorm_1 = require("typeorm");
const content_entity_1 = require("./content.entity");
let HeroCarousel = class HeroCarousel {
};
exports.HeroCarousel = HeroCarousel;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], HeroCarousel.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], HeroCarousel.prototype, "content_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => content_entity_1.Content, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'content_id' }),
    __metadata("design:type", content_entity_1.Content)
], HeroCarousel.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], HeroCarousel.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true }),
    __metadata("design:type", String)
], HeroCarousel.prototype, "subtitle", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], HeroCarousel.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true }),
    __metadata("design:type", String)
], HeroCarousel.prototype, "background_image", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], HeroCarousel.prototype, "call_to_action_text", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true }),
    __metadata("design:type", String)
], HeroCarousel.prototype, "call_to_action_link", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], HeroCarousel.prototype, "display_order", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], HeroCarousel.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], HeroCarousel.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], HeroCarousel.prototype, "updated_at", void 0);
exports.HeroCarousel = HeroCarousel = __decorate([
    (0, typeorm_1.Entity)('hero_carousel')
], HeroCarousel);
//# sourceMappingURL=hero-carousel.entity.js.map