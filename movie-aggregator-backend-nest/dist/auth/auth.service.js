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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const user_entity_1 = require("../users/user.entity");
let AuthService = class AuthService {
    constructor(jwt, users) {
        this.jwt = jwt;
        this.users = users;
    }
    async validateUser(usernameOrEmail, pass) {
        try {
            const user = await this.users.findOne({
                where: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
            });
            if (!user) {
                console.warn(`Auth failed: User not found for ${usernameOrEmail}`);
                throw new common_1.UnauthorizedException('User not found');
            }
            if (!user.password) {
                console.error(`Auth failed: User ${user.username} has no password hash`);
                throw new common_1.UnauthorizedException('Invalid user state');
            }
            const ok = await bcrypt.compare(pass, user.password);
            if (!ok) {
                console.warn(`Auth failed: Invalid password for ${usernameOrEmail}`);
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            return user;
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException)
                throw error;
            console.error('Error in validateUser:', error);
            throw new Error('Authentication system error');
        }
    }
    async login(user) {
        const payload = { sub: user.id, username: user.username, role: user.role };
        return {
            token: await this.jwt.signAsync(payload),
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                level: user.level,
                totalReviews: user.totalReviews,
                totalRatings: user.totalRatings,
                reputation: user.reputation,
                avatarUrl: user.avatarUrl,
                bio: user.bio,
                country: user.country,
            },
        };
    }
    async findById(id) {
        return this.users.findOne({ where: { id } });
    }
    async register(data) {
        const exists = await this.users.findOne({
            where: [{ username: data.username }, { email: data.email }],
        });
        if (exists)
            throw new common_1.UnauthorizedException('User already exists');
        const hashed = await bcrypt.hash(data.password, 10);
        const user = this.users.create({ ...data, password: hashed });
        await this.users.save(user);
        return this.login(user);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_2.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        typeorm_1.Repository])
], AuthService);
//# sourceMappingURL=auth.service.js.map