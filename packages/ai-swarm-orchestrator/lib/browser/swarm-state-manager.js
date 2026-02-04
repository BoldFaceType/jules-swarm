"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwarmStateManager = void 0;
const inversify_1 = require("@theia/core/shared/inversify");
const core_1 = require("@theia/core");
let SwarmStateManager = class SwarmStateManager {
    constructor() {
        this.sessions = new Map();
        this.onWorkerUpdateEmitter = new core_1.Emitter();
        this.onWorkerUpdate = this.onWorkerUpdateEmitter.event;
    }
    createSession(task) {
        const session = {
            id: `swarm-${Date.now()}`,
            task,
            workers: new Map(),
            status: 'planning',
            createdAt: Date.now()
        };
        this.sessions.set(session.id, session);
        this.currentSession = session.id;
        return session;
    }
    addWorker(sessionId, worker) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.workers.set(worker.id, worker);
            this.onWorkerUpdateEmitter.fire(worker);
        }
    }
    updateWorkerProgress(workerId, status, progress) {
        const session = this.getCurrentSession();
        if (session) {
            const worker = session.workers.get(workerId);
            if (worker) {
                worker.status = status;
                worker.progress = progress;
                worker.lastUpdate = Date.now();
                this.onWorkerUpdateEmitter.fire(worker);
            }
        }
    }
    signalConflict(workerId, conflict) {
        const session = this.getCurrentSession();
        if (session) {
            const worker = session.workers.get(workerId);
            if (worker) {
                worker.conflicts.push(conflict);
                worker.status = 'blocked';
                this.onWorkerUpdateEmitter.fire(worker);
            }
        }
    }
    getCurrentSession() {
        return this.currentSession ? this.sessions.get(this.currentSession) : undefined;
    }
    getAllWorkerStates() {
        const session = this.getCurrentSession();
        return session ? Array.from(session.workers.values()) : [];
    }
};
exports.SwarmStateManager = SwarmStateManager;
exports.SwarmStateManager = SwarmStateManager = __decorate([
    (0, inversify_1.injectable)()
], SwarmStateManager);
