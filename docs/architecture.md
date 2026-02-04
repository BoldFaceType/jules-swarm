# Jules Swarm Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         THEIA AI IDE                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │ SwarmOrchestrator│  │ Terminal Manager│  │  Chat Session   │     │
│  │     Agent       │  │   (tree view)   │  │  Persistence    │     │
│  └────────┬────────┘  └────────┬────────┘  └─────────────────┘     │
│           │                    │                                    │
│           │ delegates          │ manages                            │
│           ▼                    ▼                                    │
│  ┌─────────────────┐  ┌─────────────────────────────────────┐      │
│  │ Specialist      │  │          Worker Terminals           │      │
│  │ Agents          │  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │      │
│  │ • Conflict      │  │  │ W1  │ │ W2  │ │ W3  │ │ W4  │   │      │
│  │ • TestRunner    │  │  └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘   │      │
│  │ • Merge         │  └─────┼───────┼───────┼───────┼───────┘      │
│  └─────────────────┘        │       │       │       │              │
│                             │       │       │       │              │
│  ┌──────────────────────────┴───────┴───────┴───────┴──────────┐  │
│  │                    MCP Server (bidirectional)                │  │
│  │                   http://localhost:3001/mcp                  │  │
│  │                                                              │  │
│  │  Exposes:                        Consumes:                   │  │
│  │  • report_progress               • GitHub MCP                │  │
│  │  • signal_conflict               • Playwright MCP            │  │
│  │  • request_scope_expansion                                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              ▲
                              │ MCP callbacks
                              │
┌─────────────────────────────┴─────────────────────────────┐
│                    GEMINI CLI WORKERS                      │
│                                                            │
│  Each worker runs:                                         │
│  • parallel-jules-worker extension                         │
│  • Isolated git worktree                                   │
│  • Plan Mode enforcement                                   │
│  • Scope-limited file access                               │
│  • JSONL telemetry (fallback)                             │
└────────────────────────────────────────────────────────────┘
```

## Component Details

### SwarmOrchestrator Agent
**Location**: `packages/ai-swarm-orchestrator/src/browser/swarm-orchestrator-agent.ts`

**Responsibilities**:
1. Parse user task and decompose into subtasks
2. Assign non-overlapping file scopes to workers
3. Spawn worker terminals via TerminalService
4. Monitor worker progress via MCP callbacks
5. Coordinate conflict resolution via delegation
6. Present final changeset for approval

**Key Methods**:
- `decomposeTask(task: string): DecompositionPlan`
- `spawnWorkers(plan: DecompositionPlan): Promise<void>`
- `handleWorkerCallback(event: WorkerEvent): void`
- `delegateConflict(conflict: ConflictInfo): Promise<Resolution>`

### Gemini CLI Extension
**Location**: `parallel-jules-worker/`

**Components**:
- `gemini-extension.json`: Extension manifest with MCP server config
- `GEMINI.md`: Worker context with Plan Mode protocol
- `skills/`: Domain expertise (swarm-worker, conflict-detector, test-validator)
- `hooks/`: Lifecycle interceptors (context injection, scope enforcement, telemetry)

### State Flow

```
User Input → Orchestrator → [Decomposition] → Human Approval
                                                    │
                                                    ▼
                          ┌──────────── Worker Spawn ──────────────┐
                          │                                        │
                          ▼                                        ▼
                    Worker W1                               Worker W2
                    (worktree)                              (worktree)
                          │                                        │
                          │ MCP: report_progress                   │
                          ▼                                        ▼
                    [Implementing]                          [Implementing]
                          │                                        │
                          │ MCP: signal_conflict (if any)          │
                          ▼                                        ▼
              ┌─── Conflict? ───┐                    ┌─── Conflict? ───┐
              │                 │                    │                 │
             Yes               No                   Yes               No
              │                 │                    │                 │
              ▼                 ▼                    ▼                 ▼
      @ConflictResolver   [Complete]         @ConflictResolver   [Complete]
              │                 │                    │                 │
              ▼                 │                    ▼                 │
      Human Resolution         │            Human Resolution         │
              │                 │                    │                 │
              └────────────┬────┴────────────────────┴────────────────┘
                           │
                           ▼
                    All Workers Done
                           │
                           ▼
                    @MergeAgent → @TestRunner
                           │
                           ▼
                    Changeset UI
                           │
                           ▼
                    Human Approval → Commit
```
