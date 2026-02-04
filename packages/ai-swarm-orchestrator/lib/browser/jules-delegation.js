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
exports.JulesDelegationService = void 0;
const inversify_1 = require("@theia/core/shared/inversify");
const ai_chat_1 = require("@theia/ai-chat");
let JulesDelegationService = class JulesDelegationService {
    canDelegateToJules() {
        return __awaiter(this, void 0, void 0, function* () {
            // Check if Jules agent is available (requires Google Cloud auth)
            const agents = yield this.chatAgentService.getAgents();
            return agents.some(a => a.id === 'Jules' || a.id === 'GoogleJules');
        });
    }
    estimateTaskDuration(task, fileCount) {
        return __awaiter(this, void 0, void 0, function* () {
            // Rough estimation: 30s per file for simple changes
            // More for complex tasks
            const baseTime = fileCount * 30;
            const complexityMultiplier = this.estimateComplexity(task);
            return baseTime * complexityMultiplier;
        });
    }
    suggestDelegation(task, fileCount) {
        return __awaiter(this, void 0, void 0, function* () {
            const estimatedSeconds = yield this.estimateTaskDuration(task, fileCount);
            if (estimatedSeconds > 300) { // > 5 minutes
                return `This task may take ~${Math.round(estimatedSeconds / 60)} minutes. ` +
                    `Would you like to delegate to Jules for background processing?`;
            }
            return null;
        });
    }
    delegateToJules(request) {
        return __awaiter(this, void 0, void 0, function* () {
            // Create a GitHub issue or PR with the task
            // Jules monitors the repo and picks up tasks
            const issueBody = this.formatJulesTask(request);
            // This would integrate with GitHub MCP server
            // For now, return instructions
            return `To delegate to Jules:\n` +
                `1. Push current branch to GitHub\n` +
                `2. Create issue with label 'jules-task'\n` +
                `3. Jules will create a PR when complete`;
        });
    }
    formatJulesTask(request) {
        return `## Jules Task\n\n` +
            `**Task**: ${request.task}\n\n` +
            `**Branch**: ${request.context.branch}\n\n` +
            `**Files**:\n${request.context.relevantFiles.map(f => `- ${f}`).join('\n')}\n\n` +
            `**Options**:\n` +
            `- Priority: ${request.options.priority}\n` +
            `- Auto-merge: ${request.options.autoMerge}`;
    }
    estimateComplexity(task) {
        const complexKeywords = ['refactor', 'migrate', 'rewrite', 'convert'];
        const simpleKeywords = ['add', 'fix', 'update', 'logging'];
        if (complexKeywords.some(k => task.toLowerCase().includes(k)))
            return 2.5;
        if (simpleKeywords.some(k => task.toLowerCase().includes(k)))
            return 1.0;
        return 1.5;
    }
};
exports.JulesDelegationService = JulesDelegationService;
__decorate([
    (0, inversify_1.inject)(ai_chat_1.ChatAgentService),
    __metadata("design:type", Object)
], JulesDelegationService.prototype, "chatAgentService", void 0);
exports.JulesDelegationService = JulesDelegationService = __decorate([
    (0, inversify_1.injectable)()
], JulesDelegationService);
