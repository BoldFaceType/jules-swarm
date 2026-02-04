import { injectable, inject } from '@theia/core/shared/inversify';
import { TerminalService } from '@theia/terminal/lib/browser/base/terminal-service';
import { TerminalWidget } from '@theia/terminal/lib/browser/base/terminal-widget';
import { SwarmStateManager } from './swarm-state-manager';

@injectable()
export class SwarmTerminalManager {
    @inject(TerminalService)
    protected readonly terminalService: TerminalService;
    
    @inject(SwarmStateManager)
    protected readonly stateManager: SwarmStateManager;
    
    private workerTerminals = new Map<string, TerminalWidget>();
    
    async spawnWorker(
        workerId: string,
        taskScope: string,
        worktreePath: string,
        task: string,
        totalWorkers: number
    ): Promise<TerminalWidget> {
        // Create terminal with descriptive name
        const terminal = await this.terminalService.newTerminal({
            title: `Worker ${workerId}: ${taskScope}`,
            cwd: worktreePath,
            destroyTermOnClose: false
        });
        
        await terminal.start();
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
    }
    
    private monitorTerminalOutput(workerId: string, terminal: TerminalWidget, task?: string): void {
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
                    } catch {} // Ignore parsing errors
                }
            }
        });
    }
    
    private handleWorkerEvent(workerId: string, event: any): void {
        if (event.event === 'progress') {
            this.stateManager.updateWorkerProgress(workerId, event.status, event.message);
        } else if (event.event === 'conflict') {
            this.stateManager.signalConflict(workerId, {
                file: event.file,
                type: event.conflict_type,
                otherWorker: event.other_worker,
                details: event.details
            });
        }
    }
    
    async terminateWorker(workerId: string): Promise<void> {
        const terminal = this.workerTerminals.get(workerId);
        if (terminal) {
            // Send Ctrl+C then exit
            terminal.sendText('\x03'); // Ctrl+C
            setTimeout(() => terminal.sendText('exit\n'), 500);
        }
    }
    
    async terminateAllWorkers(): Promise<void> {
        for (const workerId of this.workerTerminals.keys()) {
            await this.terminateWorker(workerId);
        }
    }
}
