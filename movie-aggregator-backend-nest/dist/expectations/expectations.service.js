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
exports.ExpectationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const expectation_entity_1 = require("./entities/expectation.entity");
const content_entity_1 = require("../content/entities/content.entity");
let ExpectationsService = class ExpectationsService {
    constructor(expectationRepository, contentRepository) {
        this.expectationRepository = expectationRepository;
        this.contentRepository = contentRepository;
    }
    async setExpectation(userId, contentId, rating) {
        let expectation = await this.expectationRepository.findOne({ where: { user_id: userId, content_id: contentId } });
        if (expectation) {
            expectation.rating = rating;
        }
        else {
            expectation = this.expectationRepository.create({ user_id: userId, content_id: contentId, rating });
        }
        return this.expectationRepository.save(expectation);
    }
    async getExpectation(userId, contentId) {
        return this.expectationRepository.findOne({ where: { user_id: userId, content_id: contentId } });
    }
    async getContentExpectations(contentId) {
        const result = await this.expectationRepository
            .createQueryBuilder('expectation')
            .select('AVG(expectation.rating)', 'avg')
            .addSelect('COUNT(expectation.id)', 'count')
            .where('expectation.content_id = :contentId', { contentId })
            .getRawOne();
        return {
            avgRating: parseFloat(result.avg) || 0,
            count: parseInt(result.count) || 0,
        };
    }
};
exports.ExpectationsService = ExpectationsService;
exports.ExpectationsService = ExpectationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(expectation_entity_1.Expectation)),
    __param(1, (0, typeorm_1.InjectRepository)(content_entity_1.Content)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ExpectationsService);
//# sourceMappingURL=expectations.service.js.map