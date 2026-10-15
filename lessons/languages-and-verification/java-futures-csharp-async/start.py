"""Serve bundled browser runtime locally. No application backend or internet needed."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from functools import partial
import argparse
parser = argparse.ArgumentParser()
parser.add_argument('--port', type=int, default=8080)
args = parser.parse_args()
print(f'Open http://localhost:{args.port} — Ctrl+C to stop', flush=True)
ThreadingHTTPServer(('127.0.0.1', args.port), partial(SimpleHTTPRequestHandler, directory=str(Path(__file__).resolve().parent / 'app'))).serve_forever()
