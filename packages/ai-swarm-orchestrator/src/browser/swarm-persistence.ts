import { injectable, inject } from '@theia/core/shared/inversify';
import { StorageService } from '@theia/core/lib/browser/storage-service';
import { SwarmSession, WorkerState } from './swarm-state-manager';

const SWARM_STORAGE_KEY = 'ai-swarm:sessions';

@injectable()
export class SwarmPersistenceService {
    @inject(StorageService)
    protected readonly storageService: StorageService;
    
    async saveSession(session: SwarmSession): Promise<void> {
        const sessions = await this.getAllSessions();
        sessions.set(session.id, {
            ...session,
            workers: Array.from(session.workers.entries())
        });
        
        // Keep only last 10 sessions
        if (sessions.size > 10) {
            const oldest = Array.from(sessions.keys())[0];
            sessions.delete(oldest);
        }
        
        await this.storageService.setData(SWARM_STORAGE_KEY, 
            JSON.stringify(Array.from(sessions.entries()))
        );
    }
    
    async loadSession(sessionId: string): Promise<SwarmSession | undefined> {
        const sessions = await this.getAllSessions();
        const data = sessions.get(sessionId);
        if (data) {
            return {
                ...data,
                workers: new Map(data.workers)
            };
        }
        return undefined;
    }
    
    async getRecoverableSessions(): Promise<SwarmSession[]> {
        const sessions = await this.getAllSessions();
        return Array.from(sessions.values())
            .filter(s => s.status === 'running' || s.status === 'merging')
            .map(s => ({ ...s, workers: new Map(s.workers) }));
    }
    
    private async getAllSessions(): Promise<Map<string, any>> {
        const data = await this.storageService.getData<string>(SWARM_STORAGE_KEY);
        if (data) {
            return new Map(JSON.parse(data));
        }
        return new Map();
    }
}
