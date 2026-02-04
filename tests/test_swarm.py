import pytest
from unittest.mock import patch, MagicMock, AsyncMock
import asyncio
import os

# Import the module to be tested
# Note: In a real setup, we might need to adjust sys.path or use specific imports
import swarm_control

@pytest.mark.asyncio
async def test_launch_agent_constructs_correct_command():
    """Verify that agents are launched with the critical headless/yolo flags."""
    task = swarm_control.AgentTask(
        name="TestAgent",
        branch="feat/test",
        prompt="Do work",
        skill="test_skill",
        tools=[]
    )
    
    # Mock asyncio subprocess creation
    with patch("asyncio.create_subprocess_exec", new_callable=AsyncMock) as mock_exec:
        mock_process = AsyncMock()
        mock_process.wait.return_value = None
        mock_process.returncode = 0
        mock_process.communicate.return_value = (b"", b"")
        mock_exec.return_value = mock_process
        
        # Mock file opening and git operations
        with patch("builtins.open", new_callable=MagicMock), \
             patch("subprocess.run"):
            
            await swarm_control.launch_agent(task)
            
            # Assertions
            args, _ = mock_exec.call_args
            cmd_list = list(args)
            
            # VCR: These flags are non-negotiable for headless ops
            assert "gemini" in cmd_list
            assert "--yolo" in cmd_list, "Agent must run in YOLO mode for background execution"
            assert "--output-format" in cmd_list
            assert "stream-json" in cmd_list, "Output must be streaming JSON for logging"
            # Context is now injected via -p flag with @file syntax
            assert "-p" in cmd_list
