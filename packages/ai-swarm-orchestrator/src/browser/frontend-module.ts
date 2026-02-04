import { ContainerModule } from '@theia/core/shared/inversify';
import { Agent, ToolProvider } from '@theia/ai-core';
import { ChatAgent } from '@theia/ai-chat';
import { SwarmOrchestratorAgent } from './swarm-orchestrator-agent';
import { SwarmMCPToolProvider } from './swarm-mcp-tools';
import { SwarmStateManager } from './swarm-state-manager';
import { SwarmTerminalManager } from './swarm-terminal-manager';

export default new ContainerModule(bind => {
    // Register the Swarm Orchestrator as both Agent and ChatAgent
    bind(SwarmOrchestratorAgent).toSelf().inSingletonScope();
    bind(Agent).toService(SwarmOrchestratorAgent);
    bind(ChatAgent).toService(SwarmOrchestratorAgent);
    
    // Register MCP tools for worker callbacks
    bind(ToolProvider).to(SwarmMCPToolProvider).inSingletonScope();

    // Register State and Terminal Managers
    bind(SwarmStateManager).toSelf().inSingletonScope();
    bind(SwarmTerminalManager).toSelf().inSingletonScope();
});
