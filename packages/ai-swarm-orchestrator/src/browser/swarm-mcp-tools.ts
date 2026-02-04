import { ToolProvider, ToolRequest } from '@theia/ai-core';
import { injectable, inject } from '@theia/core/shared/inversify';
import { SwarmStateManager } from './swarm-state-manager';

@injectable()
export class SwarmMCPToolProvider implements ToolProvider {
  
  @inject(SwarmStateManager)
  protected readonly stateManager: SwarmStateManager;

  // Implementation of the required interface method
  // Note: To expose multiple tools, we might need multiple providers or a different pattern
  // For now, we return the main progress reporting tool here
  getTool(): ToolRequest {
      return this.getReportProgressTool();
  }

  // Tool: report_progress
  getReportProgressTool(): ToolRequest {
    return {
      id: 'report_progress',
      name: 'report_progress',
      description: 'Report worker progress to orchestrator',
      parameters: {
        type: 'object',
        properties: {
          worker_id: { type: 'string' },
          status: { type: 'string', enum: ['analyzing','planning','implementing','testing','complete','blocked'] },
          message: { type: 'string' },
          files_modified: { type: 'array', items: { type: 'string' } }
        },
        required: ['worker_id', 'status', 'message']
      },
      handler: async (args) => this.handleProgressReport(JSON.parse(args))
    };
  }

  // Tool: signal_conflict
  getSignalConflictTool(): ToolRequest {
    return {
      id: 'signal_conflict',
      name: 'signal_conflict',
      description: 'Alert orchestrator about file conflict',
      parameters: {
        type: 'object',
        properties: {
          worker_id: { type: 'string' },
          file: { type: 'string' },
          conflict_type: { type: 'string', enum: ['additive','semantic','destructive'] },
          other_worker: { type: 'string' },
          details: { type: 'string' }
        },
        required: ['worker_id', 'file', 'conflict_type']
      },
      handler: async (args) => this.handleConflictSignal(JSON.parse(args))
    };
  }

  // Tool: request_scope_expansion
  getRequestScopeExpansionTool(): ToolRequest {
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
      handler: async (args) => this.handleScopeRequest(JSON.parse(args))
    };
  }

  private async handleProgressReport(args: any) {
      this.stateManager.updateWorkerProgress(args.worker_id, args.status, args.message);
      return { content: [{ type: 'text', text: 'OK' }] };
  }

  private async handleConflictSignal(args: any) {
      this.stateManager.signalConflict(args.worker_id, {
          file: args.file,
          type: args.conflict_type,
          otherWorker: args.other_worker,
          details: args.details
      });
      return { content: [{ type: 'text', text: 'Conflict signaled' }] };
  }

  private async handleScopeRequest(args: any) {
      console.log('Scope Request from ' + args.worker_id + ':', args.files, args.reason);
      return { content: [{ type: 'text', text: 'Request received' }] };
  }
}
