"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CriticsModule = void 0;
const common_1 = require("@nestjs/common");
const critics_controller_1 = require("./critics.controller");
const critics_service_1 = require("./critics.service");
const typeorm_1 = require("@nestjs/typeorm");
const publication_entity_1 = require("./entities/publication.entity");
let CriticsModule = class CriticsModule {
};
exports.CriticsModule = CriticsModule;
exports.CriticsModule = CriticsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([publication_entity_1.Publication])],
        controllers: [critics_controller_1.CriticsController],
        providers: [critics_service_1.CriticsService],
        exports: [critics_service_1.CriticsService]
    })
], CriticsModule);
//# sourceMappingURL=critics.module.js.map