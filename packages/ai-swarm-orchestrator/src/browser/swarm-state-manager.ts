import { injectable, inject } from '@theia/core/shared/inversify';
import { Emitter, Event } from '@theia/core';

export interface WorkerState {
    id: string;
    terminalId?: string;
    worktreePath: string;
    taskScope: string;
    status: 'pending' | 'running' | 'complete' | 'error' | 'blocked';
    progress: string;
    filesModified: string[];
    conflicts: ConflictInfo[];
    startTime: number;
    lastUpdate: number;
}

export interface ConflictInfo {
    file: string;
    type: 'additive' | 'semantic' | 'destructive';
    otherWorker?: string;
    details: string;
}

export interface SwarmSession {
    id: string;
    task: string;
    workers: Map<string, WorkerState>;
    status: 'planning' | 'running' | 'merging' | 'complete' | 'aborted';
    createdAt: number;
}

@injectable()
export class SwarmStateManager {
    private sessions = new Map<string, SwarmSession>();
    private currentSession: string | undefined;
    
    private readonly onWorkerUpdateEmitter = new Emitter<WorkerState>();
    readonly onWorkerUpdate: Event<WorkerState> = this.onWorkerUpdateEmitter.event;
    
    createSession(task: string): SwarmSession {
        const session: SwarmSession = {
            id: `swarm-${Date.now()}`,
            task,
            workers: new Map(),
            status: 'planning',
            createdAt: Date.now()
        };
        this.sessions.set(session.id, session);
        this.currentSession = session.id;
        return session;
    }
    
    addWorker(sessionId: string, worker: WorkerState): void {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.workers.set(worker.id, worker);
            this.onWorkerUpdateEmitter.fire(worker);
        }
    }
    
    updateWorkerProgress(workerId: string, status: WorkerState['status'], progress: string): void {
        const session = this.getCurrentSession();
        if (session) {
            const worker = session.workers.get(workerId);
            if (worker) {
                worker.status = status;
                worker.progress = progress;
                worker.lastUpdate = Date.now();
                this.onWorkerUpdateEmitter.fire(worker);
            }
        }
    }
    
    signalConflict(workerId: string, conflict: ConflictInfo): void {
        const session = this.getCurrentSession();
        if (session) {
            const worker = session.workers.get(workerId);
            if (worker) {
                worker.conflicts.push(conflict);
                worker.status = 'blocked';
                this.onWorkerUpdateEmitter.fire(worker);
            }
        }
    }
    
    getCurrentSession(): SwarmSession | undefined {
        return this.currentSession ? this.sessions.get(this.currentSession) : undefined;
    }
    
    getAllWorkerStates(): WorkerState[] {
        const session = this.getCurrentSession();
        return session ? Array.from(session.workers.values()) : [];
    }
}
