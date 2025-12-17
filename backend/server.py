"""
Simple wrapper to start Node.js server.
Since supervisor expects uvicorn, we use this to launch node directly.
"""
import os
import subprocess
import sys
from pathlib import Path

# Get the directory where this script is located  
BACKEND_DIR = Path(__file__).parent.absolute()

# Start Node.js server (this replaces the current process)
os.chdir(str(BACKEND_DIR))
os.execvp("node", ["node", "server.js"])
