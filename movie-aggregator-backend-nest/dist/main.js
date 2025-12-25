"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const logging_interceptor_1 = require("./common/logging.interceptor");
const all_exceptions_filter_1 = require("./common/all-exceptions.filter");
const request_id_middleware_1 = require("./common/request-id.middleware");
const winston_1 = require("./common/logger/winston");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { cors: {
            origin: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:3000')
                .split(',')
                .map(s => s.trim()),
            credentials: true,
        } });
    app.use(new request_id_middleware_1.RequestIdMiddleware().use);
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new logging_interceptor_1.LoggingInterceptor());
    app.useGlobalFilters(new all_exceptions_filter_1.AllExceptionsFilter());
    app.useLogger({
        log: (message) => winston_1.appLogger.info(typeof message === 'string' ? message : JSON.stringify(message)),
        error: (message) => winston_1.appLogger.error(typeof message === 'string' ? message : JSON.stringify(message)),
        warn: (message) => winston_1.appLogger.warn(typeof message === 'string' ? message : JSON.stringify(message)),
        debug: (message) => winston_1.appLogger.debug(typeof message === 'string' ? message : JSON.stringify(message)),
        verbose: (message) => winston_1.appLogger.verbose(typeof message === 'string' ? message : JSON.stringify(message)),
    });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Movie Aggregator API')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('swagger', app, document);
    await app.listen(8080);
}
bootstrap();
//# sourceMappingURL=main.js.map