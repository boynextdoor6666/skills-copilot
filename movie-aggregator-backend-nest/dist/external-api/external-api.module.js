"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalApiModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const tmdb_service_1 = require("./tmdb.service");
const igdb_service_1 = require("./igdb.service");
const external_api_controller_1 = require("./external-api.controller");
const content_entity_1 = require("../content/entities/content.entity");
let ExternalApiModule = class ExternalApiModule {
};
exports.ExternalApiModule = ExternalApiModule;
exports.ExternalApiModule = ExternalApiModule = __decorate([
    (0, common_1.Module)({
        imports: [
            axios_1.HttpModule.register({
                timeout: 10000,
                maxRedirects: 5,
            }),
            config_1.ConfigModule,
            typeorm_1.TypeOrmModule.forFeature([content_entity_1.Content]),
        ],
        controllers: [external_api_controller_1.ExternalApiController],
        providers: [tmdb_service_1.TmdbService, igdb_service_1.IgdbService],
        exports: [tmdb_service_1.TmdbService, igdb_service_1.IgdbService],
    })
], ExternalApiModule);
//# sourceMappingURL=external-api.module.js.map