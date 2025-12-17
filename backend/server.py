"""
ASGI wrapper that starts the Node.js Express server.
This is needed because supervisor is configured to run uvicorn.
"""

import subprocess
import asyncio
import os
import signal
import sys
from pathlib import Path

# Get the directory where this script is located
BACKEND_DIR = Path(__file__).parent.absolute()

# Global process handle
node_process = None

async def start_node_server():
    """Start the Node.js server as a subprocess."""
    global node_process
    
    print(f"Starting Node.js server from {BACKEND_DIR}")
    
    # Start Node.js server
    node_process = subprocess.Popen(
        ["node", "server.js"],
        cwd=str(BACKEND_DIR),
        env={**os.environ},
        stdout=sys.stdout,
        stderr=sys.stderr
    )
    
    # Wait for the process
    while node_process.poll() is None:
        await asyncio.sleep(1)
    
    return node_process.returncode

def shutdown_handler(signum, frame):
    """Handle shutdown signals."""
    global node_process
    if node_process:
        print("Shutting down Node.js server...")
        node_process.terminate()
        try:
            node_process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            node_process.kill()
    sys.exit(0)

# ASGI application
async def app(scope, receive, send):
    """ASGI application - proxies to Node.js server."""
    if scope['type'] == 'lifespan':
        while True:
            message = await receive()
            if message['type'] == 'lifespan.startup':
                # Start Node.js server in background
                asyncio.create_task(start_node_server())
                await send({'type': 'lifespan.startup.complete'})
            elif message['type'] == 'lifespan.shutdown':
                shutdown_handler(None, None)
                await send({'type': 'lifespan.shutdown.complete'})
                return
    else:
        # This shouldn't be reached as Node.js handles HTTP directly
        await send({
            'type': 'http.response.start',
            'status': 502,
            'headers': [[b'content-type', b'text/plain']],
        })
        await send({
            'type': 'http.response.body',
            'body': b'Node.js server handling requests directly on port 8001',
        })

# Register signal handlers
signal.signal(signal.SIGTERM, shutdown_handler)
signal.signal(signal.SIGINT, shutdown_handler)

if __name__ == "__main__":
    # If run directly, just start the Node.js server
    asyncio.run(start_node_server())
