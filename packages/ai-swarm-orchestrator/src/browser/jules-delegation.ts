import { injectable, inject } from '@theia/core/shared/inversify';
import { ChatAgentService } from '@theia/ai-chat';

export interface JulesDelegationRequest {
    task: string;
    context: {
        repository: string;
        branch: string;
        relevantFiles: string[];
    };
    options: {
        priority: 'low' | 'normal' | 'high';
        notifyOnComplete: boolean;
        autoMerge: boolean;
    };
}

@injectable()
export class JulesDelegationService {
    @inject(ChatAgentService)
    protected readonly chatAgentService: ChatAgentService;
    
    async canDelegateToJules(): Promise<boolean> {
        // Check if Jules agent is available (requires Google Cloud auth)
        const agents = await this.chatAgentService.getAgents();
        return agents.some(a => a.id === 'Jules' || a.id === 'GoogleJules');
    }
    
    async estimateTaskDuration(task: string, fileCount: number): Promise<number> {
        // Rough estimation: 30s per file for simple changes
        // More for complex tasks
        const baseTime = fileCount * 30;
        const complexityMultiplier = this.estimateComplexity(task);
        return baseTime * complexityMultiplier;
    }
    
    async suggestDelegation(task: string, fileCount: number): Promise<string | null> {
        const estimatedSeconds = await this.estimateTaskDuration(task, fileCount);
        
        if (estimatedSeconds > 300) { // > 5 minutes
            return `This task may take ~${Math.round(estimatedSeconds / 60)} minutes. ` +
                   `Would you like to delegate to Jules for background processing?`;
        }
        return null;
    }
    
    async delegateToJules(request: JulesDelegationRequest): Promise<string> {
        // Create a GitHub issue or PR with the task
        // Jules monitors the repo and picks up tasks
        const issueBody = this.formatJulesTask(request);
        
        // This would integrate with GitHub MCP server
        // For now, return instructions
        return `To delegate to Jules:\n` +
               `1. Push current branch to GitHub\n` +
               `2. Create issue with label 'jules-task'\n` +
               `3. Jules will create a PR when complete`;
    }
    
    private formatJulesTask(request: JulesDelegationRequest): string {
        return `## Jules Task\n\n` +
               `**Task**: ${request.task}\n\n` +
               `**Branch**: ${request.context.branch}\n\n` +
               `**Files**:\n${request.context.relevantFiles.map(f => `- ${f}`).join('\n')}\n\n` +
               `**Options**:\n` +
               `- Priority: ${request.options.priority}\n` +
               `- Auto-merge: ${request.options.autoMerge}`;
    }
    
    private estimateComplexity(task: string): number {
        const complexKeywords = ['refactor', 'migrate', 'rewrite', 'convert'];
        const simpleKeywords = ['add', 'fix', 'update', 'logging'];
        
        if (complexKeywords.some(k => task.toLowerCase().includes(k))) return 2.5;
        if (simpleKeywords.some(k => task.toLowerCase().includes(k))) return 1.0;
        return 1.5;
    }
}
