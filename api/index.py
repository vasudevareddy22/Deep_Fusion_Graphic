import sys
import os
from pathlib import Path

# Set up project root on sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.app import app

# Vercel serverless entrypoint
handler = app
