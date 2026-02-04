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
exports.SwarmTerminalManager = void 0;
const inversify_1 = require("@theia/core/shared/inversify");
const terminal_service_1 = require("@theia/terminal/lib/browser/base/terminal-service");
const swarm_state_manager_1 = require("./swarm-state-manager");
let SwarmTerminalManager = class SwarmTerminalManager {
    constructor() {
        this.workerTerminals = new Map();
    }
    spawnWorker(workerId, taskScope, worktreePath, task, totalWorkers) {
        return __awaiter(this, void 0, void 0, function* () {
            // Create terminal with descriptive name
            const terminal = yield this.terminalService.newTerminal({
                title: `Worker ${workerId}: ${taskScope}`,
                cwd: worktreePath,
                destroyTermOnClose: false
            });
            yield terminal.start();
            this.workerTerminals.set(workerId, terminal);
            // Build environment and command
            const mcpUrl = process.env.THEIA_MCP_URL || 'http://localhost:3001/mcp';
            const envVars = [
                `WORKER_ID=${workerId}`,
                `TASK_SCOPE='${taskScope}'`,
                `WORKTREE_PATH='${worktreePath}'`,
                `TOTAL_WORKERS=${totalWorkers}`,
                `THEIA_MCP_URL='${mcpUrl}'`
            ].join(' ');
            const command = `${envVars} gemini -e parallel-jules-worker --output-format stream-json`;
            // Send command to terminal
            terminal.sendText(command + '\n');
            // Monitor terminal output for JSONL events and wait for ready state to send task
            this.monitorTerminalOutput(workerId, terminal, task);
            return terminal;
        });
    }
    monitorTerminalOutput(workerId, terminal, task) {
        let taskSent = false;
        // Subscribe to terminal output for JSONL parsing and readiness detection
        terminal.onData(data => {
            // Readiness detection: Look for a prompt or a specific start-up JSON event
            if (task && !taskSent && (data.includes('>') || data.includes('🤖'))) {
                taskSent = true;
                terminal.sendText(task + '\n');
            }
            const lines = data.split('\n');
            for (const line of lines) {
                if (line.startsWith('{') && line.includes('"event"')) {
                    try {
                        const event = JSON.parse(line);
                        this.handleWorkerEvent(workerId, event);
                    }
                    catch (_a) { } // Ignore parsing errors
                }
            }
        });
    }
    handleWorkerEvent(workerId, event) {
        if (event.event === 'progress') {
            this.stateManager.updateWorkerProgress(workerId, event.status, event.message);
        }
        else if (event.event === 'conflict') {
            this.stateManager.signalConflict(workerId, {
                file: event.file,
                type: event.conflict_type,
                otherWorker: event.other_worker,
                details: event.details
            });
        }
    }
    terminateWorker(workerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const terminal = this.workerTerminals.get(workerId);
            if (terminal) {
                // Send Ctrl+C then exit
                terminal.sendText('\x03'); // Ctrl+C
                setTimeout(() => terminal.sendText('exit\n'), 500);
            }
        });
    }
    terminateAllWorkers() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const workerId of this.workerTerminals.keys()) {
                yield this.terminateWorker(workerId);
            }
        });
    }
};
exports.SwarmTerminalManager = SwarmTerminalManager;
__decorate([
    (0, inversify_1.inject)(terminal_service_1.TerminalService),
    __metadata("design:type", Object)
], SwarmTerminalManager.prototype, "terminalService", void 0);
__decorate([
    (0, inversify_1.inject)(swarm_state_manager_1.SwarmStateManager),
    __metadata("design:type", swarm_state_manager_1.SwarmStateManager)
], SwarmTerminalManager.prototype, "stateManager", void 0);
exports.SwarmTerminalManager = SwarmTerminalManager = __decorate([
    (0, inversify_1.injectable)()
], SwarmTerminalManager);
