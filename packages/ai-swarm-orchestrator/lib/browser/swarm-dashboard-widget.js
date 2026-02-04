"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SwarmDashboardWidget_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwarmDashboardWidget = void 0;
const React = __importStar(require("@theia/core/shared/react"));
const inversify_1 = require("@theia/core/shared/inversify");
const react_widget_1 = require("@theia/core/lib/browser/widgets/react-widget");
const swarm_state_manager_1 = require("./swarm-state-manager");
let SwarmDashboardWidget = SwarmDashboardWidget_1 = class SwarmDashboardWidget extends react_widget_1.ReactWidget {
    init() {
        this.id = SwarmDashboardWidget_1.ID;
        this.title.label = SwarmDashboardWidget_1.LABEL;
        this.title.iconClass = 'codicon codicon-server-process';
        this.title.closable = true;
        // Subscribe to state updates
        this.stateManager.onWorkerUpdate(() => this.update());
    }
    render() {
        const session = this.stateManager.getCurrentSession();
        if (!session) {
            return React.createElement("div", { className: "swarm-dashboard-empty" },
                React.createElement("p", null, "No active swarm session"),
                React.createElement("p", null,
                    "Use ",
                    React.createElement("code", null, "/swarm <task>"),
                    " to start"));
        }
        return React.createElement("div", { className: "swarm-dashboard" },
            React.createElement("div", { className: "swarm-header" },
                React.createElement("h3", null,
                    "\uD83D\uDC1D Swarm: ",
                    session.id),
                React.createElement("span", { className: `status-badge status-${session.status}` }, session.status.toUpperCase())),
            React.createElement("div", { className: "swarm-task" },
                React.createElement("strong", null, "Task:"),
                " ",
                session.task),
            React.createElement("div", { className: "worker-grid" }, Array.from(session.workers.values()).map(worker => React.createElement(WorkerCard, { key: worker.id, worker: worker }))),
            React.createElement("div", { className: "swarm-actions" },
                React.createElement("button", { onClick: () => this.abortSwarm() }, "\u23F9\uFE0F Abort All"),
                React.createElement("button", { onClick: () => this.refreshStatus() }, "\uD83D\uDD04 Refresh")));
    }
    abortSwarm() {
        // Implementation for abort
    }
    refreshStatus() {
        // Implementation for refresh
    }
};
exports.SwarmDashboardWidget = SwarmDashboardWidget;
SwarmDashboardWidget.ID = 'swarm-dashboard';
SwarmDashboardWidget.LABEL = 'Swarm Dashboard';
__decorate([
    (0, inversify_1.inject)(swarm_state_manager_1.SwarmStateManager),
    __metadata("design:type", swarm_state_manager_1.SwarmStateManager)
], SwarmDashboardWidget.prototype, "stateManager", void 0);
__decorate([
    (0, inversify_1.postConstruct)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SwarmDashboardWidget.prototype, "init", null);
exports.SwarmDashboardWidget = SwarmDashboardWidget = SwarmDashboardWidget_1 = __decorate([
    (0, inversify_1.injectable)()
], SwarmDashboardWidget);
const WorkerCard = ({ worker }) => {
    const statusIcons = {
        pending: '⏳',
        running: '🔄',
        complete: '✅',
        error: '❌',
        blocked: '⚠️'
    };
    const estimateProgress = (w) => {
        // Mock progress estimation
        return 50;
    };
    const formatDuration = (ms) => {
        return Math.floor(ms / 1000) + 's';
    };
    const progressPercent = estimateProgress(worker);
    return (React.createElement("div", { className: `worker-card worker-${worker.status}` },
        React.createElement("div", { className: "worker-header" },
            React.createElement("span", { className: "worker-id" },
                statusIcons[worker.status],
                " ",
                worker.id),
            React.createElement("span", { className: "worker-scope" }, worker.taskScope)),
        React.createElement("div", { className: "progress-bar" },
            React.createElement("div", { className: "progress-fill", style: { width: `${progressPercent}%` } })),
        React.createElement("div", { className: "worker-progress" }, worker.progress),
        worker.conflicts.length > 0 && (React.createElement("div", { className: "worker-conflicts" },
            "\u26A0\uFE0F ",
            worker.conflicts.length,
            " conflict(s)")),
        React.createElement("div", { className: "worker-files" },
            worker.filesModified.slice(0, 3).map(f => React.createElement("span", { key: f, className: "file-badge" }, f)),
            worker.filesModified.length > 3 &&
                React.createElement("span", { className: "file-badge" },
                    "+",
                    worker.filesModified.length - 3)),
        React.createElement("div", { className: "worker-time" },
            "\u23F1\uFE0F ",
            formatDuration(Date.now() - worker.startTime))));
};
