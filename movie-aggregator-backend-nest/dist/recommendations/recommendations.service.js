"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var RecommendationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const recommendation_entity_1 = require("./entities/recommendation.entity");
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
let RecommendationsService = RecommendationsService_1 = class RecommendationsService {
    constructor(recommendationsRepository) {
        this.recommendationsRepository = recommendationsRepository;
        this.logger = new common_1.Logger(RecommendationsService_1.name);
    }
    async getRecommendationsForUser(userId, limit = 10) {
        return this.recommendationsRepository.find({
            where: { user_id: userId },
            relations: ['content'],
            order: { score: 'DESC' },
            take: limit,
        });
    }
    async generateRecommendations() {
        this.logger.log('Starting recommendation generation process...');
        const scriptPath = path.resolve(__dirname, '../../../../analytics/ml/recommender.py');
        return new Promise((resolve, reject) => {
            (0, child_process_1.exec)(`python "${scriptPath}"`, (error, stdout, stderr) => {
                if (error) {
                    this.logger.error(`Error executing ML script: ${error.message}`);
                    reject(error);
                    return;
                }
                if (stderr) {
                    this.logger.warn(`ML Script Stderr: ${stderr}`);
                }
                this.logger.log(`ML Script Output: ${stdout}`);
                resolve({ message: 'Recommendations generated successfully', output: stdout });
            });
        });
    }
};
exports.RecommendationsService = RecommendationsService;
exports.RecommendationsService = RecommendationsService = RecommendationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(recommendation_entity_1.Recommendation)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], RecommendationsService);
//# sourceMappingURL=recommendations.service.js.map