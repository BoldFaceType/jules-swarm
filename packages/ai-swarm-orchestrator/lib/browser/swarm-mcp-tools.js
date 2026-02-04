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
exports.SwarmMCPToolProvider = void 0;
const inversify_1 = require("@theia/core/shared/inversify");
const swarm_state_manager_1 = require("./swarm-state-manager");
let SwarmMCPToolProvider = class SwarmMCPToolProvider {
    // Implementation of the required interface method
    // Note: To expose multiple tools, we might need multiple providers or a different pattern
    // For now, we return the main progress reporting tool here
    getTool() {
        return this.getReportProgressTool();
    }
    // Tool: report_progress
    getReportProgressTool() {
        return {
            id: 'report_progress',
            name: 'report_progress',
            description: 'Report worker progress to orchestrator',
            parameters: {
                type: 'object',
                properties: {
                    worker_id: { type: 'string' },
                    status: { type: 'string', enum: ['analyzing', 'planning', 'implementing', 'testing', 'complete', 'blocked'] },
                    message: { type: 'string' },
                    files_modified: { type: 'array', items: { type: 'string' } }
                },
                required: ['worker_id', 'status', 'message']
            },
            handler: (args) => __awaiter(this, void 0, void 0, function* () { return this.handleProgressReport(JSON.parse(args)); })
        };
    }
    // Tool: signal_conflict
    getSignalConflictTool() {
        return {
            id: 'signal_conflict',
            name: 'signal_conflict',
            description: 'Alert orchestrator about file conflict',
            parameters: {
                type: 'object',
                properties: {
                    worker_id: { type: 'string' },
                    file: { type: 'string' },
                    conflict_type: { type: 'string', enum: ['additive', 'semantic', 'destructive'] },
                    other_worker: { type: 'string' },
                    details: { type: 'string' }
                },
                required: ['worker_id', 'file', 'conflict_type']
            },
            handler: (args) => __awaiter(this, void 0, void 0, function* () { return this.handleConflictSignal(JSON.parse(args)); })
        };
    }
    // Tool: request_scope_expansion
    getRequestScopeExpansionTool() {
        return {
            id: 'request_scope_expansion',
            name: 'request_scope_expansion',
            description: 'Request access to additional files',
            parameters: {
                type: 'object',
                properties: {
                    worker_id: { type: 'string' },
                    files: { type: 'array', items: { type: 'string' } },
                    reason: { type: 'string' }
                },
                required: ['worker_id', 'files', 'reason']
            },
            handler: (args) => __awaiter(this, void 0, void 0, function* () { return this.handleScopeRequest(JSON.parse(args)); })
        };
    }
    handleProgressReport(args) {
        return __awaiter(this, void 0, void 0, function* () {
            this.stateManager.updateWorkerProgress(args.worker_id, args.status, args.message);
            return { content: [{ type: 'text', text: 'OK' }] };
        });
    }
    handleConflictSignal(args) {
        return __awaiter(this, void 0, void 0, function* () {
            this.stateManager.signalConflict(args.worker_id, {
                file: args.file,
                type: args.conflict_type,
                otherWorker: args.other_worker,
                details: args.details
            });
            return { content: [{ type: 'text', text: 'Conflict signaled' }] };
        });
    }
    handleScopeRequest(args) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Scope Request from ' + args.worker_id + ':', args.files, args.reason);
            return { content: [{ type: 'text', text: 'Request received' }] };
        });
    }
};
exports.SwarmMCPToolProvider = SwarmMCPToolProvider;
__decorate([
    (0, inversify_1.inject)(swarm_state_manager_1.SwarmStateManager),
    __metadata("design:type", swarm_state_manager_1.SwarmStateManager)
], SwarmMCPToolProvider.prototype, "stateManager", void 0);
exports.SwarmMCPToolProvider = SwarmMCPToolProvider = __decorate([
    (0, inversify_1.injectable)()
], SwarmMCPToolProvider);
