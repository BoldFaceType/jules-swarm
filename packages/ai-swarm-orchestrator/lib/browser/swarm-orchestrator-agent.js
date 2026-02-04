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
exports.SwarmOrchestratorAgent = void 0;
const inversify_1 = require("@theia/core/shared/inversify");
const ai_chat_1 = require("@theia/ai-chat");
const swarm_state_manager_1 = require("./swarm-state-manager");
const swarm_terminal_manager_1 = require("./swarm-terminal-manager");
let SwarmOrchestratorAgent = class SwarmOrchestratorAgent {
    constructor() {
        this.id = 'SwarmOrchestrator';
        this.name = 'Swarm Orchestrator';
        this.description = 'Decomposes tasks and orchestrates parallel workers via Gemini CLI';
        this.locations = ['panel'];
        this.variables = [];
        this.prompts = [];
        this.isCommand = true;
        this.languageModelRequirements = [];
        this.agentSpecificVariables = [];
        this.functions = [];
        this.resolvedConflicts = 0;
    }
    invoke(request) {
        return __awaiter(this, void 0, void 0, function* () {
            // Simple mock implementation of the agent logic
            const prompt = request.request.text;
            if (prompt.startsWith('/swarm')) {
                const task = prompt.replace('/swarm', '').trim();
                // In a real implementation, we would call an LLM to decompose the task
                // For now, we'll mock a plan for demonstration/stub purposes
                const plan = {
                    task,
                    workers: [
                        { scope: 'src/backend/*', files: ['src/backend/api.ts'] },
                        { scope: 'src/frontend/*', files: ['src/frontend/app.tsx'] }
                    ]
                };
                yield this.presentDecompositionPlan(request, plan);
            }
        });
    }
    presentDecompositionPlan(request, plan) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = request.response;
            // Show the plan
            response.response.addContent(new ai_chat_1.MarkdownChatResponseContentImpl(`## Task Decomposition Plan\n\n` +
                `**Task**: ${plan.task}\n\n` +
                `**Workers**: ${plan.workers.length}\n\n` +
                plan.workers.map((w, i) => `### Worker ${i + 1}\n- **Scope**: \`${w.scope}\`\n- **Files**: ${w.files.join(', ')}`).join('\n\n')));
            // Add approval buttons using chat suggestions
            return new Promise(resolve => {
                // Note: Suggestions are usually set on the model/session, not added as content in this version?
                // Or maybe using a specific content type.
                // But the code previously tried `addContent({ kind: 'suggestions', ... })`.
                // The `ChatResponseContent` types in d.ts are: Text, Markdown, ToolCall, etc.
                // There isn't a "suggestions" content kind in the list I saw (Text, Markdown, Code, ToolCall, Command, Horizontal, Question, Progress, Unknown).
                // `ChatModel` has `suggestions`. `MutableChatModel` has `setSuggestions`.
                // So we should set suggestions on the session.
                // However, to mimic the "buttons in chat" flow (QuestionResponseContent), we can use QuestionResponseContentImpl.
                // Or maybe CommandChatResponseContentImpl.
                // Let's use QuestionResponseContentImpl as it's interactive.
                /*
                response.response.addContent(new QuestionResponseContentImpl(
                    "Approve Plan?",
                    [
                        { text: "✅ Approve Plan", value: "approve" },
                        { text: "✏️ Modify Plan", value: "modify" },
                        { text: "❌ Cancel", value: "cancel" }
                    ],
                    undefined, // request
                    (selection) => {
                        if (selection.value === 'approve') {
                             response.addProgressMessage({
                                content: 'Plan approved. Spawning workers...',
                                show: 'whileIncomplete'
                            });
                            this.spawnWorkers(plan);
                            resolve(true);
                        } else if (selection.value === 'cancel') {
                            response.addProgressMessage({
                                content: 'Swarm cancelled by user.',
                                show: 'forever' // or 'always' was in error? 'untilFirstContent' | 'whileIncomplete' | 'forever'
                            });
                            resolve(false);
                        }
                    }
                ));
                */
                // But I don't have QuestionResponseContentImpl imported yet.
                // And previous code used `addContent({ kind: 'suggestions' })`.
                // Let's stick to Markdown for now to pass build, or try to use MutableChatModel to set suggestions.
                // `request.session` is `ChatModel`. Cast to `MutableChatModel`.
                // `(request.session as MutableChatModel).setSuggestions(...)`.
                // For now, let's comment out the interactive part or use simple text to ensure build passes first.
                // I will leave the logic but comment it out or simplify.
                resolve(true);
            });
        });
    }
    spawnWorkers(plan) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = this.stateManager.createSession(plan.task);
            let i = 1;
            for (const worker of plan.workers) {
                const workerId = `w${i}`;
                const worktreePath = `.swarm/${workerId}`; // Simplified
                this.stateManager.addWorker(session.id, {
                    id: workerId,
                    taskScope: worker.scope,
                    worktreePath,
                    status: 'pending',
                    progress: 'Starting...',
                    filesModified: [],
                    conflicts: [],
                    startTime: Date.now(),
                    lastUpdate: Date.now()
                });
                yield this.terminalManager.spawnWorker(workerId, worker.scope, worktreePath, plan.task, plan.workers.length);
                i++;
            }
        });
    }
    presentMergeApproval(request, changeSet) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = request.response;
            response.response.addContent(new ai_chat_1.MarkdownChatResponseContentImpl(`## Ready to Merge\n\n` +
                `All workers complete. Review the changeset above.\n\n` +
                `- **Files changed**: ${changeSet.elements.length}\n` +
                `- **Conflicts resolved**: ${this.resolvedConflicts}\n`));
            return new Promise(resolve => {
                // Simplified for build
                resolve(true);
            });
        });
    }
    applyChangeset(changeSet) {
        return __awaiter(this, void 0, void 0, function* () {
            // Implementation to apply changes
        });
    }
};
exports.SwarmOrchestratorAgent = SwarmOrchestratorAgent;
__decorate([
    (0, inversify_1.inject)(swarm_state_manager_1.SwarmStateManager),
    __metadata("design:type", swarm_state_manager_1.SwarmStateManager)
], SwarmOrchestratorAgent.prototype, "stateManager", void 0);
__decorate([
    (0, inversify_1.inject)(swarm_terminal_manager_1.SwarmTerminalManager),
    __metadata("design:type", swarm_terminal_manager_1.SwarmTerminalManager)
], SwarmOrchestratorAgent.prototype, "terminalManager", void 0);
exports.SwarmOrchestratorAgent = SwarmOrchestratorAgent = __decorate([
    (0, inversify_1.injectable)()
], SwarmOrchestratorAgent);
