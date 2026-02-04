import { injectable } from '@theia/core/shared/inversify';
import { Emitter, Event } from '@theia/core';

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerConfig {
    failureThreshold: number;      // failures before opening (default: 3)
    recoveryTimeout: number;       // ms before half-open (default: 30000)
    halfOpenSuccessThreshold: number; // successes to close (default: 2)
}

@injectable()
export class CircuitBreaker {
    private state: CircuitState = 'closed';
    private failureCount = 0;
    private successCount = 0;
    private lastFailureTime = 0;
    
    private readonly onStateChangeEmitter = new Emitter<CircuitState>();
    readonly onStateChange: Event<CircuitState> = this.onStateChangeEmitter.event;
    
    constructor(
        private readonly config: CircuitBreakerConfig = {
            failureThreshold: 3,
            recoveryTimeout: 30000,
            halfOpenSuccessThreshold: 2
        }
    ) {}
    
    async execute<T>(operation: () => Promise<T>): Promise<T> {
        if (this.state === 'open') {
            if (Date.now() - this.lastFailureTime > this.config.recoveryTimeout) {
                this.transitionTo('half-open');
            } else {
                throw new CircuitOpenError('Circuit breaker is open');
            }
        }
        
        try {
            const result = await operation();
            this.recordSuccess();
            return result;
        } catch (error) {
            this.recordFailure();
            throw error;
        }
    }
    
    private recordSuccess(): void {
        if (this.state === 'half-open') {
            this.successCount++;
            if (this.successCount >= this.config.halfOpenSuccessThreshold) {
                this.transitionTo('closed');
            }
        }
        this.failureCount = 0;
    }
    
    private recordFailure(): void {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        
        if (this.state === 'half-open') {
            this.transitionTo('open');
        } else if (this.failureCount >= this.config.failureThreshold) {
            this.transitionTo('open');
        }
    }
    
    private transitionTo(newState: CircuitState): void {
        this.state = newState;
        if (newState === 'closed') {
            this.failureCount = 0;
            this.successCount = 0;
        } else if (newState === 'half-open') {
            this.successCount = 0;
        }
        this.onStateChangeEmitter.fire(newState);
    }
    
    getState(): CircuitState { return this.state; }
    forceClose(): void { this.transitionTo('closed'); }
    forceOpen(): void { this.transitionTo('open'); }
}

export class CircuitOpenError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CircuitOpenError';
    }
}
