// tests/mock-orchestrator/server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

// Root endpoint for status check
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        service: 'Mock Theia Orchestrator',
        mcp_endpoint: '/mcp',
        message: 'Send MCP requests to /mcp'
    });
});

// Mock MCP Tools
const tools = [
    {
        name: 'report_progress',
        description: 'Report worker progress to orchestrator',
        parameters: {
            type: 'object',
            properties: {
                worker_id: { type: 'string' },
                status: { type: 'string' },
                message: { type: 'string' }
            },
            required: ['worker_id', 'status', 'message']
        }
    },
    {
        name: 'signal_conflict',
        description: 'Alert orchestrator about file conflict',
        parameters: {
            type: 'object',
            properties: {
                worker_id: { type: 'string' },
                file: { type: 'string' },
                conflict_type: { type: 'string' }
            },
            required: ['worker_id', 'file', 'conflict_type']
        }
    },
    {
        name: 'request_scope_expansion',
        description: 'Request access to additional files',
        parameters: {
            type: 'object',
            properties: {
                worker_id: { type: 'string' },
                files: { type: 'array', items: { type: 'string' } },
                reason: { type: 'string' }
            },
            required: ['worker_id', 'files', 'reason']
        }
    }
];

// MCP Discovery Endpoint
app.get('/mcp', (req, res) => {
    res.json({
        name: 'theia-orchestrator',
        description: 'Mock Theia Orchestrator MCP Server',
        tools: tools
    });
});

// MCP Tool Execution Endpoint (Mock implementation of MCP over HTTP)
// Note: Real MCP spec might differ, but this mocks the behavior expected by our worker
// if it uses a simple HTTP client or if we adapt the worker to use this.
// Assuming the worker uses an MCP client that we configured to hit this URL.
// The manifest config: "url": "http://localhost:3001/mcp"
// Standard MCP over HTTP might use SSE or POST.
// Let's implement a simple JSON-RPC style POST endpoint at /mcp/tools/call or similar if the client supports it.
// Or if the client expects SSE for events and POST for calls.

// For now, let's just log requests to show connectivity.

app.post('/mcp', (req, res) => {
    console.log('Received MCP Request:', JSON.stringify(req.body, null, 2));
    // Respond with a dummy success
    res.json({
        jsonrpc: "2.0",
        id: req.body.id,
        result: {
            content: [{ type: "text", text: "Mock Orchestrator received request" }]
        }
    });
});

app.listen(port, () => {
    console.log(`Mock Orchestrator running at http://localhost:${port}`);
});
