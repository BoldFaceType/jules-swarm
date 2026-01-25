const path = require('path');

module.exports = {
  /**
   * Pre-execution guardrail.
   * Prevents agents from accessing sensitive directories or running destructive commands.
   */
  onBeforeToolExecution: async (toolName, args, context) => {

    // 1. Prevent escaping the Worktree (Sandbox Enforcer)
    // We strictly resolve paths to ensure agents can't use "../" to break out.
    if (args.path) {
      const currentDir = process.cwd();
      // Resolve the absolute path of the target
      const resolvedPath = path.resolve(currentDir, args.path);

      // If the Worktree logic is working, currentDir should be inside .worktrees/
      // But we explicitly check that the target is still inside the current CWD.
      if (!resolvedPath.startsWith(currentDir)) {
        throw new Error(`⛔ SECURITY: Directory traversal blocked. Agent trapped in: ${currentDir}`);
      }
    }

    // 2. Block High-Risk Terminal Commands
    if (toolName === 'terminal_run_command' || toolName === 'run_shell_command') {
      const forbidden = ['rm -rf /', 'git push', 'git reset --hard', 'shutdown', 'mkfs'];
      
      // Check if the command argument contains any forbidden strings
      // Note: This is a basic check. A robust system would parse the AST of the shell command.
      const cmd = args.command || args.cmd || "";
      if (forbidden.some(bad => cmd.includes(bad))) {
        throw new Error(`⛔ SECURITY: Command '${cmd}' is blacklisted.`);
      }
    }

    // 3. Log for Orchestrator (Structured Audit)
    // This feeds into the stream-json output for the Orchestrator
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "AUDIT",
      tool: toolName,
      args: args
    }));
  }
};
