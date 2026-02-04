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
exports.CircuitOpenError = exports.CircuitBreaker = void 0;
const inversify_1 = require("@theia/core/shared/inversify");
const core_1 = require("@theia/core");
let CircuitBreaker = class CircuitBreaker {
    constructor(config = {
        failureThreshold: 3,
        recoveryTimeout: 30000,
        halfOpenSuccessThreshold: 2
    }) {
        this.config = config;
        this.state = 'closed';
        this.failureCount = 0;
        this.successCount = 0;
        this.lastFailureTime = 0;
        this.onStateChangeEmitter = new core_1.Emitter();
        this.onStateChange = this.onStateChangeEmitter.event;
    }
    execute(operation) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.state === 'open') {
                if (Date.now() - this.lastFailureTime > this.config.recoveryTimeout) {
                    this.transitionTo('half-open');
                }
                else {
                    throw new CircuitOpenError('Circuit breaker is open');
                }
            }
            try {
                const result = yield operation();
                this.recordSuccess();
                return result;
            }
            catch (error) {
                this.recordFailure();
                throw error;
            }
        });
    }
    recordSuccess() {
        if (this.state === 'half-open') {
            this.successCount++;
            if (this.successCount >= this.config.halfOpenSuccessThreshold) {
                this.transitionTo('closed');
            }
        }
        this.failureCount = 0;
    }
    recordFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        if (this.state === 'half-open') {
            this.transitionTo('open');
        }
        else if (this.failureCount >= this.config.failureThreshold) {
            this.transitionTo('open');
        }
    }
    transitionTo(newState) {
        this.state = newState;
        if (newState === 'closed') {
            this.failureCount = 0;
            this.successCount = 0;
        }
        else if (newState === 'half-open') {
            this.successCount = 0;
        }
        this.onStateChangeEmitter.fire(newState);
    }
    getState() { return this.state; }
    forceClose() { this.transitionTo('closed'); }
    forceOpen() { this.transitionTo('open'); }
};
exports.CircuitBreaker = CircuitBreaker;
exports.CircuitBreaker = CircuitBreaker = __decorate([
    (0, inversify_1.injectable)(),
    __metadata("design:paramtypes", [Object])
], CircuitBreaker);
class CircuitOpenError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CircuitOpenError';
    }
}
exports.CircuitOpenError = CircuitOpenError;
