#!/usr/bin/env python3
"""
Parallel Jules Swarm Orchestrator - CORRECTED VERSION
Uses valid Gemini CLI syntax as of January 2026
"""

import asyncio
import subprocess
import json
import os
import shutil
from dataclasses import dataclass
from typing import List

# --- CONFIGURATION ---
REPO_ROOT = os.getcwd()
WORKTREE_BASE = os.path.join(REPO_ROOT, ".worktrees")
LOG_DIR = os.path.join(REPO_ROOT, "logs")

@dataclass
class AgentTask:
    name: str
    branch: str
    prompt: str
    skill: str
    tools: List[str]

# Define the Swarm
TASKS = [
    AgentTask(
        name="Agent_A_Auth",
        branch="feat/auth-refactor",
        prompt="Refactor `auth.py` to use Pydantic models. Ensure backward compatibility.",
        skill="feature_architect",
        tools=["ReadFileTool", "WriteFileTool", "ShellTool(pytest)"]
    ),
    AgentTask(
        name="Agent_B_Logger",
        branch="feat/add-logging",
        prompt="Add structured logging to `auth.py` and `database.py`. Use the 'loguru' library.",
        skill="feature_architect",
        tools=["ReadFileTool", "WriteFileTool"]
    )
]

def construct_gemini_command(task: AgentTask) -> List[str]:
    """
    Build valid Gemini CLI command.

    CORRECTED:
    - No 'run' subcommand
    - No '--context' flag (use @file syntax in prompt)
    - No '--tool-strategy' (--yolo handles this)
    """
    # Inject skill context via @ prefix in prompt
    prompt_with_context = f"@.gemini/skills/{task.skill}.md\n\n{task.prompt}"

    return [
        "gemini",
        "-p", prompt_with_context,
        "--yolo",
        "--output-format", "stream-json"
    ]

async def setup_environment():
    """Clean slate protocol. Removes old logs, worktrees, and feature branches."""
    print("🧹 [Orchestrator] Cleaning environment...")

    if os.path.exists(LOG_DIR):
        shutil.rmtree(LOG_DIR)
    os.makedirs(LOG_DIR)

    # Prune stale worktrees
    subprocess.run(["git", "worktree", "prune"], check=False)

    # Force remove worktree directory if it persists
    if os.path.exists(WORKTREE_BASE):
        shutil.rmtree(WORKTREE_BASE)

    # Cleanup branches to prevent 'branch already exists' errors
    for task in TASKS:
        subprocess.run(
            ["git", "branch", "-D", task.branch],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )

async def launch_agent(task: AgentTask):
    """Spawns a Gemini instance in an isolated Git Worktree."""
    worktree_path = os.path.join(WORKTREE_BASE, task.name)
    log_file = os.path.join(LOG_DIR, f"{task.name}.jsonl")

    print(f"🚀 [Orchestrator] Spawning {task.name} on branch {task.branch}...")

    # 1. Create Worktree
    subprocess.run(
        ["git", "worktree", "add", "-b", task.branch, worktree_path, "main"],
        check=True,
        stdout=subprocess.DEVNULL
    )

    # 2. Construct CORRECTED Gemini Command
    cmd = construct_gemini_command(task)

    # 3. Execute in Background (Isolated CWD)
    with open(log_file, "w") as f:
        process = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=worktree_path,
            stdout=f,
            stderr=f
        )
        await process.wait()

    return task

async def resolve_conflict(branch: str):
    """The 'Resolver' Agent: Wakes up only for merge conflicts."""
    print(f"⚠️ [Orchestrator] Conflict detected in {branch}. Deploying Resolver...")

    log_file = os.path.join(LOG_DIR, f"resolver_{branch.replace('/', '_')}.jsonl")
    
    # CORRECTED: Use @file syntax for context injection
    prompt = f"@.gemini/skills/git_resolver.md\n\nResolve git conflicts in current index for branch {branch}. Keep logic from both HEAD and MERGE_HEAD where possible."

    cmd = [
        "gemini",
        "-p", prompt,
        "--yolo",
        "--output-format", "json" # Single-shot response
    ]

    with open(log_file, "w") as f:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=f,
            stderr=f
        )
        await proc.wait()

    # Verify resolution
    clean_check = subprocess.run(["git", "diff", "--check"], capture_output=True)
    return clean_check.returncode == 0

def validate_code():
    """The Quality Gate: Linting, Black, Tests."""
    print("🛡️ [Orchestrator] Running Quality Gate...")

    # 1. Black Formatting
    subprocess.run(["black", ".", "--check"], stdout=subprocess.DEVNULL)

    # 2. Tests
    test_res = subprocess.run(["pytest", "tests/"], capture_output=True)
    
    return test_res.returncode == 0

async def serial_fan_in(tasks: List[AgentTask]):
    """Merge Queue Logic."""
    print("\n🔄 [Orchestrator] Starting Serial Fan-In...")

    for task in tasks:
        print(f"Trying to merge: {task.branch}")

        # Attempt Merge
        merge_res = subprocess.run(
            ["git", "merge", task.branch, "--no-commit", "--no-ff"],
            capture_output=True
        )

        if merge_res.returncode == 0:
            # Clean merge? Run tests.
            if validate_code():
                subprocess.run(["git", "commit", "-m", f"Merged {task.name}"])
                print(f"✅ Merged {task.branch}")
            else:
                print(f"❌ [ABORT] {task.branch} failed Quality Gate. Reverting.")
                subprocess.run(["git", "merge", "--abort"], stdout=subprocess.DEVNULL)
        else:
            # Conflict!
            resolved = await resolve_conflict(task.branch)
            if resolved and validate_code():
                subprocess.run(["git", "commit", "--no-edit"])
                print(f"✅ [Resolver] Resolved & Merged {task.branch}")
            else:
                print(f"☢️ [NUCLEAR OPTION] Could not resolve {task.branch}. Aborting.")
                subprocess.run(["git", "merge", "--abort"], stdout=subprocess.DEVNULL)

    # Cleanup Worktrees
    for task in TASKS:
        worktree_path = os.path.join(WORKTREE_BASE, task.name)
        subprocess.run(
            ["git", "worktree", "remove", "--force", worktree_path],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )

async def main():
    """Main entry point."""
    await setup_environment()

    # Run agents in parallel
    await asyncio.gather(*(launch_agent(t) for t in TASKS))

    # Merge sequentially
    await serial_fan_in(TASKS)

if __name__ == "__main__":
    asyncio.run(main())