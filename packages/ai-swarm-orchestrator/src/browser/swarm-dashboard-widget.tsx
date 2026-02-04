import * as React from '@theia/core/shared/react';
import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { SwarmStateManager, WorkerState, SwarmSession } from './swarm-state-manager';

@injectable()
export class SwarmDashboardWidget extends ReactWidget {
    static readonly ID = 'swarm-dashboard';
    static readonly LABEL = 'Swarm Dashboard';
    
    @inject(SwarmStateManager)
    protected readonly stateManager: SwarmStateManager;
    
    @postConstruct()
    protected init(): void {
        this.id = SwarmDashboardWidget.ID;
        this.title.label = SwarmDashboardWidget.LABEL;
        this.title.iconClass = 'codicon codicon-server-process';
        this.title.closable = true;
        
        // Subscribe to state updates
        this.stateManager.onWorkerUpdate(() => this.update());
    }
    
    protected render(): React.ReactNode {
        const session = this.stateManager.getCurrentSession();
        if (!session) {
            return <div className="swarm-dashboard-empty">
                <p>No active swarm session</p>
                <p>Use <code>/swarm &lt;task&gt;</code> to start</p>
            </div>;
        }
        
        return <div className="swarm-dashboard">
            <div className="swarm-header">
                <h3>🐝 Swarm: {session.id}</h3>
                <span className={`status-badge status-${session.status}`}>
                    {session.status.toUpperCase()}
                </span>
            </div>
            
            <div className="swarm-task">
                <strong>Task:</strong> {session.task}
            </div>
            
            <div className="worker-grid">
                {Array.from(session.workers.values()).map(worker => 
                    <WorkerCard key={worker.id} worker={worker} />
                )}
            </div>
            
            <div className="swarm-actions">
                <button onClick={() => this.abortSwarm()}>
                    ⏹️ Abort All
                </button>
                <button onClick={() => this.refreshStatus()}>
                    🔄 Refresh
                </button>
            </div>
        </div>;
    }

    private abortSwarm() {
        // Implementation for abort
    }

    private refreshStatus() {
        // Implementation for refresh
    }
}

const WorkerCard: React.FC<{ worker: WorkerState }> = ({ worker }) => {
    const statusIcons: Record<WorkerState['status'], string> = {
        pending: '⏳',
        running: '🔄',
        complete: '✅',
        error: '❌',
        blocked: '⚠️'
    };
    
    const estimateProgress = (w: WorkerState) => {
        // Mock progress estimation
        return 50; 
    };

    const formatDuration = (ms: number) => {
        return Math.floor(ms / 1000) + 's';
    }
    
    const progressPercent = estimateProgress(worker);
    
    return (
        <div className={`worker-card worker-${worker.status}`}>
            <div className="worker-header">
                <span className="worker-id">{statusIcons[worker.status]} {worker.id}</span>
                <span className="worker-scope">{worker.taskScope}</span>
            </div>
            
            <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            
            <div className="worker-progress">{worker.progress}</div>
            
            {worker.conflicts.length > 0 && (
                <div className="worker-conflicts">
                    ⚠️ {worker.conflicts.length} conflict(s)
                </div>
            )}
            
            <div className="worker-files">
                {worker.filesModified.slice(0, 3).map(f => 
                    <span key={f} className="file-badge">{f}</span>
                )}
                {worker.filesModified.length > 3 && 
                    <span className="file-badge">+{worker.filesModified.length - 3}</span>
                }
            </div>
            
            <div className="worker-time">
                ⏱️ {formatDuration(Date.now() - worker.startTime)}
            </div>
        </div>
    );
};
