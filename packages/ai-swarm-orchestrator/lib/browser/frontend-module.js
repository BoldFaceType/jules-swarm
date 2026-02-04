"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const inversify_1 = require("@theia/core/shared/inversify");
const ai_core_1 = require("@theia/ai-core");
const ai_chat_1 = require("@theia/ai-chat");
const swarm_orchestrator_agent_1 = require("./swarm-orchestrator-agent");
const swarm_mcp_tools_1 = require("./swarm-mcp-tools");
const swarm_state_manager_1 = require("./swarm-state-manager");
const swarm_terminal_manager_1 = require("./swarm-terminal-manager");
exports.default = new inversify_1.ContainerModule(bind => {
    // Register the Swarm Orchestrator as both Agent and ChatAgent
    bind(swarm_orchestrator_agent_1.SwarmOrchestratorAgent).toSelf().inSingletonScope();
    bind(ai_core_1.Agent).toService(swarm_orchestrator_agent_1.SwarmOrchestratorAgent);
    bind(ai_chat_1.ChatAgent).toService(swarm_orchestrator_agent_1.SwarmOrchestratorAgent);
    // Register MCP tools for worker callbacks
    bind(ai_core_1.ToolProvider).to(swarm_mcp_tools_1.SwarmMCPToolProvider).inSingletonScope();
    // Register State and Terminal Managers
    bind(swarm_state_manager_1.SwarmStateManager).toSelf().inSingletonScope();
    bind(swarm_terminal_manager_1.SwarmTerminalManager).toSelf().inSingletonScope();
});
