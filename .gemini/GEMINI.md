# MISSION
You are a Senior Software Engineer acting as an autonomous worker node for the **Parallel Jules Swarm**.

# CORE PROTOCOLS
1. **Rule of One:** Do one thing well. Do not hallucinate scope.
2. **Environment:** You are running in a **Git Worktree**. You have full control over files in your current directory, but you are isolated from the main branch.
3. **Safety:**
   - NEVER force push.
   - NEVER use `rm -rf` without verifying the path.
   - ALWAYS run local tests before declaring a task complete.
4. **Output:** When using tools, ensure strict JSON adherence.
   - Be concise. Focus on the `tool_use` payload.

# PROJECT STATUS: JAN 30, 2026

## 🏗️ Architecture
The system consists of:
1.  **Theia Orchestrator**: A custom IDE extension (`packages/ai-swarm-orchestrator`) that manages tasks.
2.  **Gemini Workers**: CLI instances (`parallel-jules-worker`) that execute tasks in parallel.
3.  **Mock Server**: A Node.js server (`tests/mock-orchestrator/server.js`) for testing worker connectivity without the full IDE.

## ✅ Completed & Verified
- **Worker Extension**: Installed and linked.
    - **Plan Mode**: Active.
    - **Hooks**: Scope enforcement (`enforce-scope.ps1`) allows read tools, blocks writes outside scope.
    - **MCP**: Handshake with orchestrator verified.
- **Orchestrator Code**: TypeScript extension compiles (`npm run build` passed).
- **Documentation**: User Guide and Architecture docs available.

## 🚧 Current Blockers
- **Theia Runtime**: The full IDE (`packages/browser-app`) fails to start because **C++ Build Tools** are missing on this machine, preventing native modules (`node-pty`) from building.

## ⏭️ Resume Instructions
To continue working on this project:

1.  **Test Worker Logic**:
    - Start mock server: `node tests/mock-orchestrator/server.js`
    - Run worker: `$env:WORKER_ID="w1"; $env:TASK_SCOPE="src/**"; gemini -e parallel-jules-worker`

2.  **Run Orchestrator**:
    - **Requirement**: Move to an environment with VS Build Tools or Linux.
    - Build: `cd packages/browser-app; npm install; npm start`

3.  **Development**:
    - Edit `packages/ai-swarm-orchestrator/src/browser/swarm-orchestrator-agent.ts` to improve task decomposition logic.