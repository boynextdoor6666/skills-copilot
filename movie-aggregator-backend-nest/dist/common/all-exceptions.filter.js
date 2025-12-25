"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
const winston_1 = require("./logger/winston");
let AllExceptionsFilter = class AllExceptionsFilter {
    catch(exception, host) {
        var _a, _b;
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception instanceof common_1.HttpException
            ? exception.getStatus()
            : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const message = exception instanceof common_1.HttpException
            ? exception.getResponse()
            : (exception === null || exception === void 0 ? void 0 : exception.message) || 'Internal server error';
        const method = request === null || request === void 0 ? void 0 : request.method;
        const url = request === null || request === void 0 ? void 0 : request.url;
        const userId = (_a = request === null || request === void 0 ? void 0 : request.user) === null || _a === void 0 ? void 0 : _a.userId;
        winston_1.appLogger.error(`× ${method} ${url} ${status} user=${userId !== null && userId !== void 0 ? userId : '-'} reqId=${(_b = request === null || request === void 0 ? void 0 : request.id) !== null && _b !== void 0 ? _b : '-'} msg=${typeof message === 'string' ? message : JSON.stringify(message)}`);
        try {
            response.status(status).json({
                statusCode: status,
                path: url,
                message: typeof message === 'string' ? message : undefined,
                error: typeof message === 'object' ? message : undefined,
                timestamp: new Date().toISOString(),
            });
        }
        catch {
        }
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = __decorate([
    (0, common_1.Catch)()
], AllExceptionsFilter);
//# sourceMappingURL=all-exceptions.filter.js.map