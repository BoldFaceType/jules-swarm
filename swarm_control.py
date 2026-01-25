import asyncio
import os
import shutil
import json
from dataclasses import dataclass
from typing import List
from loguru import logger

# --- CONFIGURATION ---
REPO_ROOT = os.getcwd()
WORKTREE_BASE = os.path.join(REPO_ROOT, ".worktrees")
LOG_DIR = os.path.join(REPO_ROOT, "logs")

# Ensure logs directory exists
os.makedirs(LOG_DIR, exist_ok=True)

# Configure Loguru
logger.add(os.path.join(LOG_DIR, "orchestrator.log"), rotation="1 MB")

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
        tools=["fs_read", "fs_write", "terminal_run_test"]
    ),
    AgentTask(
        name="Agent_B_Logger",
        branch="feat/add-logging",
        prompt="Add structured logging to `auth.py` and `database.py`. Use the 'loguru' library.",
        skill="feature_architect",
        tools=["fs_read", "fs_write"]
    )
]

async def run_command(cmd: List[str], cwd: str = None, check: bool = True) -> int:
    """Helper to run async subprocesses with logging."""
    cmd_str = " ".join(cmd)
    logger.info(f"Running: {cmd_str} in {cwd or 'root'}")
    
    process = await asyncio.create_subprocess_exec(
        *cmd,
        cwd=cwd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    
    stdout, stderr = await process.communicate()
    
    if stdout:
        logger.debug(f"[STDOUT] {cmd_str}: {stdout.decode().strip()}")
    if stderr:
        logger.warning(f"[STDERR] {cmd_str}: {stderr.decode().strip()}")
        
    if check and process.returncode != 0:
        logger.error(f"Command failed: {cmd_str} with return code {process.returncode}")
        raise Exception(f"Command failed: {cmd_str}")
        
    return process.returncode

async def setup_environment():
    """Clean slate protocol. Removes old logs, worktrees, and feature branches."""
    logger.info("🧹 [Orchestrator] Cleaning environment...")

    if os.path.exists(LOG_DIR):
        # We don't remove LOG_DIR itself to keep the orchestrator log, just contents
        # Or simplistic approach: just ensure it exists (done at top)
        pass

    # Prune stale worktrees
    # Using 'git worktree prune' is safer than manual deletion if git knows about them
    await run_command(["git", "worktree", "prune"], check=False)

    # Force remove worktree directory if it persists (manual cleanup)
    if os.path.exists(WORKTREE_BASE):
        try:
            shutil.rmtree(WORKTREE_BASE)
            logger.success(f"Removed {WORKTREE_BASE}")
        except Exception as e:
            logger.error(f"Failed to remove {WORKTREE_BASE}: {e}")

    # Create worktree base again
    os.makedirs(WORKTREE_BASE, exist_ok=True)

    # Cleanup branches to prevent 'branch already exists' errors
    # Note: This deletes the local feature branches if they exist
    for task in TASKS:
        await run_command(["git", "branch", "-D", task.branch], check=False)

async def launch_agent(task: AgentTask):
    """Spawns a Jules instance in an isolated Git Worktree."""
    worktree_path = os.path.join(WORKTREE_BASE, task.name)
    # Uses .jsonl extension because we are streaming events
    log_file = os.path.join(LOG_DIR, f"{task.name}.jsonl")

    logger.info(f"🚀 [Orchestrator] Spawning {task.name} on branch {task.branch}...")

    # 1. Create Worktree
    # Note: 'main' must exist. If your default branch is 'master', change accordingly.
    # We create a new branch (-b) based on main
    await run_command(["git", "worktree", "add", "-b", task.branch, worktree_path, "main"])

    # 2. Construct Gemini Command (Headless Mode)
    # Note: Adjust the paths to skills/configs to be absolute or relative to the worktree correctly
    # Since we run the command FROM the worktree_path, relative paths to the repo root (..) might be needed
    # OR we pass absolute paths. Let's assume standard Gemini CLI behavior.
    
    # NOTE: In a real scenario, you might need to ensure the CLI can find the config files.
    # Here we assume the CLI finds the .gemini folder in the root or we pass absolute paths.
    repo_abs_path = os.path.abspath(REPO_ROOT)
    
    cmd = [
        "gemini", "run",
        "--context", f"{repo_abs_path}/.gemini/GEMINI.md {repo_abs_path}/.gemini/skills/{task.skill}.md",
        "--prompt", task.prompt,
        "--tool-strategy", "autonomous",
        # HEADLESS CONFIGURATION
        "--yolo",                 # Auto-approve tool use
        "--output-format", "stream-json", # JSONL for real-time monitoring
        "--quiet"                 # Suppress non-essential stdout
    ]

    # 3. Execute in Background (Isolated CWD)
    logger.info(f"Command: {' '.join(cmd)}")
    
    with open(log_file, "w") as f:
        process = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=worktree_path,
            stdout=f,
            stderr=asyncio.subprocess.PIPE 
        )
        
        # We wait for the process to finish
        stdout, stderr = await process.communicate()
        
        if stderr:
             logger.warning(f"Agent {task.name} STDERR: {stderr.decode()}")

    logger.success(f"Agent {task.name} finished with code {process.returncode}")
    return task

async def resolve_conflict(branch: str):
    """The 'Resolver' Agent: Wakes up only for merge conflicts."""
    logger.warning(f"⚠️ [Orchestrator] Conflict detected in {branch}. Deploying Resolver...")
    
    log_file = os.path.join(LOG_DIR, f"resolver_{branch.replace('/', '_')}.jsonl")
    repo_abs_path = os.path.abspath(REPO_ROOT)

    # We resolve IN the main tree (or a merge staging tree). 
    # For simplicity here, we assume we are running this in the root repo 
    # (after the failed merge attempt in serial_fan_in).
    
    cmd = [
        "gemini", "run",
        "--context", f"{repo_abs_path}/.gemini/GEMINI.md {repo_abs_path}/.gemini/skills/git_resolver.md",
        "--prompt", f"Resolve git conflicts in current index for branch {branch}. Keep logic from both HEAD and MERGE_HEAD where possible.",
        "--tool-strategy", "autonomous",
        "--yolo",
        "--output-format", "json"
    ]

    with open(log_file, "w") as f:
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=f,
            stderr=asyncio.subprocess.PIPE
        )
        await process.communicate()

    # Verify resolution
    # 'git diff --check' returns 0 if clean, non-zero if conflict markers remain
    exit_code = await run_command(["git", "diff", "--check"], check=False)
    return exit_code == 0

async def validate_code():
    """The Quality Gate: Linting, Black, Tests."""
    logger.info("🛡️ [Orchestrator] Running Quality Gate...")

    try:
        # 1. Black Formatting
        await run_command(["black", ".", "--check"], check=False)
        
        # 2. Tests
        # Capturing output allows us to debug why a merge was rejected if needed
        await run_command(["pytest", "tests"])
        
        return True
    except Exception:
        return False

async def serial_fan_in(tasks: List[AgentTask]):
    """Merge Queue Logic."""
    logger.info("\n🔄 [Orchestrator] Starting Serial Fan-In...")

    for task in tasks:
        logger.info(f"Trying to merge: {task.branch}")

        # Attempt Merge
        # --no-commit to allow us to verify before committing
        # --no-ff to create a merge commit for history
        merge_code = await run_command(["git", "merge", task.branch, "--no-commit", "--no-ff"], check=False)

        if merge_code == 0:
            # Clean merge? Run tests.
            if await validate_code():
                await run_command(["git", "commit", "-m", f"Merged {task.name}"])
                logger.success(f"✅ Merged {task.branch}")
            else:
                logger.error(f"❌ [ABORT] {task.branch} failed Quality Gate. Reverting.")
                await run_command(["git", "merge", "--abort"])
        else:
            # Conflict!
            logger.warning(f"Conflict detected in {task.branch}")
            resolved = await resolve_conflict(task.branch)
            
            if resolved and await validate_code():
                # If resolved, we need to commit the result (resolve_conflict does not commit)
                # But wait, resolve_conflict runs 'gemini run'. 
                # Does the agent commit? The prompt says "Do NOT COMMIT".
                # So we commit here.
                await run_command(["git", "commit", "--no-edit"])
                logger.success(f"✅ [Resolver] Resolved & Merged {task.branch}")
            else:
                logger.error(f"☢️ [NUCLEAR OPTION] Could not resolve {task.branch}. Aborting.")
                await run_command(["git", "merge", "--abort"])

    # Cleanup Worktrees (Optional - maybe keep for inspection)
    # await run_command(["git", "worktree", "remove", "--force", ...]) 

if __name__ == "__main__":
    # Ensure we are in a git repo
    if not os.path.exists(os.path.join(REPO_ROOT, ".git")):
        print("Error: Not a git repository. Please init git first.")
        exit(1)

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    try:
        loop.run_until_complete(setup_environment())
        
        # Run agents in parallel
        # launch_agent is async, so gather runs them concurrently
        loop.run_until_complete(asyncio.gather(*(launch_agent(t) for t in TASKS)))
        
        # Merge sequentially
        loop.run_until_complete(serial_fan_in(TASKS))
    finally:
        loop.close()
