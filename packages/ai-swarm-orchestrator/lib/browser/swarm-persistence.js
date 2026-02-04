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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwarmPersistenceService = void 0;
const inversify_1 = require("@theia/core/shared/inversify");
const storage_service_1 = require("@theia/core/lib/browser/storage-service");
const SWARM_STORAGE_KEY = 'ai-swarm:sessions';
let SwarmPersistenceService = class SwarmPersistenceService {
    saveSession(session) {
        return __awaiter(this, void 0, void 0, function* () {
            const sessions = yield this.getAllSessions();
            sessions.set(session.id, Object.assign(Object.assign({}, session), { workers: Array.from(session.workers.entries()) }));
            // Keep only last 10 sessions
            if (sessions.size > 10) {
                const oldest = Array.from(sessions.keys())[0];
                sessions.delete(oldest);
            }
            yield this.storageService.setData(SWARM_STORAGE_KEY, JSON.stringify(Array.from(sessions.entries())));
        });
    }
    loadSession(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const sessions = yield this.getAllSessions();
            const data = sessions.get(sessionId);
            if (data) {
                return Object.assign(Object.assign({}, data), { workers: new Map(data.workers) });
            }
            return undefined;
        });
    }
    getRecoverableSessions() {
        return __awaiter(this, void 0, void 0, function* () {
            const sessions = yield this.getAllSessions();
            return Array.from(sessions.values())
                .filter(s => s.status === 'running' || s.status === 'merging')
                .map(s => (Object.assign(Object.assign({}, s), { workers: new Map(s.workers) })));
        });
    }
    getAllSessions() {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.storageService.getData(SWARM_STORAGE_KEY);
            if (data) {
                return new Map(JSON.parse(data));
            }
            return new Map();
        });
    }
};
exports.SwarmPersistenceService = SwarmPersistenceService;
__decorate([
    (0, inversify_1.inject)(storage_service_1.StorageService),
    __metadata("design:type", Object)
], SwarmPersistenceService.prototype, "storageService", void 0);
exports.SwarmPersistenceService = SwarmPersistenceService = __decorate([
    (0, inversify_1.injectable)()
], SwarmPersistenceService);
