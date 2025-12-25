"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const winston_1 = require("./logger/winston");
let LoggingInterceptor = class LoggingInterceptor {
    intercept(context, next) {
        var _a;
        const req = context.switchToHttp().getRequest();
        if (!req)
            return next.handle();
        const { method, url } = req;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        const requestId = req.id || req.headers['x-request-id'];
        const start = Date.now();
        winston_1.appLogger.info(`→ ${method} ${url} user=${userId !== null && userId !== void 0 ? userId : '-'} reqId=${requestId !== null && requestId !== void 0 ? requestId : '-'}`);
        return next.handle().pipe((0, operators_1.tap)(() => {
            const res = context.switchToHttp().getResponse();
            const duration = Date.now() - start;
            winston_1.appLogger.info(`← ${method} ${url} ${res === null || res === void 0 ? void 0 : res.statusCode} ${duration}ms user=${userId !== null && userId !== void 0 ? userId : '-'} reqId=${requestId !== null && requestId !== void 0 ? requestId : '-'}`);
        }), (0, operators_1.catchError)((err) => {
            var _a;
            const res = context.switchToHttp().getResponse();
            const duration = Date.now() - start;
            winston_1.appLogger.error(`× ${method} ${url} ${(_a = res === null || res === void 0 ? void 0 : res.statusCode) !== null && _a !== void 0 ? _a : '-'} ${duration}ms user=${userId !== null && userId !== void 0 ? userId : '-'} reqId=${requestId !== null && requestId !== void 0 ? requestId : '-'} msg=${err === null || err === void 0 ? void 0 : err.message}`);
            throw err;
        }));
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = __decorate([
    (0, common_1.Injectable)()
], LoggingInterceptor);
//# sourceMappingURL=logging.interceptor.js.map