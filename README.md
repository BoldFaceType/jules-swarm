# Parallel Jules Swarm

A multi-agent autonomous coding system using Gemini CLI and Theia AI.

## Overview

This project implements a "Parallel Swarm" architecture where multiple AI agents work on subtasks in isolated Git worktrees, coordinated by an orchestrator.

### Architecture

1.  **Orchestrator**: [Theia AI IDE](https://theia-ide.org/) (v1.67+) acts as the coordinator.
    *   **Agent**: `@SwarmOrchestrator` handles task decomposition and worker management.
    *   **Specialists**: `@ConflictResolver`, `@TestRunner`, `@MergeAgent`.
    *   **Theia Extension**: `packages/ai-swarm-orchestrator` provides state management and terminal integration.

2.  **Workers**: [Gemini CLI](https://github.com/google-gemini/gemini-cli) instances.
    *   **Extension**: `parallel-jules-worker` enhances the CLI with swarm-specific skills and hooks.
    *   **Isolation**: Each worker runs in a dedicated `git worktree`.
    *   **Feedback**: Workers report progress and conflicts via bidirectional MCP to Theia.

## Project Structure

*   `parallel-jules-worker/`: Gemini CLI extension.
*   `packages/ai-swarm-orchestrator/`: Theia AI extension.
*   `.theia/`: Theia IDE configuration and specialist agent prompts.
*   `.prompts/`: Slash command templates (`/swarm`, etc.).
*   `swarm_control.py`: Legacy standalone Python orchestrator.
*   `tests/`: Swarm verification tests.

## Getting Started

### Prerequisites

*   Theia AI IDE (v1.67+)
*   Gemini CLI (v0.27+)
*   Node.js 18+

### Setup

1.  **Install the Gemini extension**:
    ```bash
    gemini extensions link ./parallel-jules-worker
    ```

2.  **Build the Theia extension**:
    ```bash
    cd packages/ai-swarm-orchestrator
    npm install
    npm run build
    ```

3.  **Run in Theia**:
    *   Launch Theia AI IDE in this directory.
    *   Use the `/swarm` command in the AI chat to start a task.

## Documentation

*   [User Guide](docs/user-guide.md)
*   [Architecture](docs/architecture.md)
*   [Manifest v1.1.0](jules_swarm_extension_manifest_v1.1.0.md)

## License

MIT
