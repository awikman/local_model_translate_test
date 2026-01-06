#!/usr/bin/env python3
"""
Simple HTTP server for serving CKEditor5 Local Translation demo.
Run this from project root directory.
"""

import http.server
import socketserver
import os
import sys
import mimetypes
from pathlib import Path

PORT = 8001

print("[DEBUG] server.py imported")
print("[DEBUG] Python version:", sys.version)
print("[DEBUG] Working directory:", os.getcwd())
print("[DEBUG] Script path:", os.path.abspath(__file__))

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, directory=None, **kwargs):
        if directory is None:
            directory = os.getcwd()
        self.directory = directory
        super().__init__(*args, directory=directory, **kwargs)

    def end_headers(self):
        content_type = self.guess_type(self.path)

        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')

        print(f"[DEBUG] Serving {self.path} as {content_type}")
        super().end_headers()

    def guess_type(self, path):
        """Guess MIME type of a file."""
        # Strip query parameters from path
        path = str(path).split('?')[0]
        
        mimetype, encoding = mimetypes.guess_type(path)
        if mimetype:
            return mimetype
        
        ext = Path(path).suffix.lower()

        mime_map = {
            '.js': 'application/javascript',
            '.mjs': 'application/javascript',
            '.css': 'text/css; charset=utf-8',
            '.html': 'text/html; charset=utf-8',
            '.json': 'application/json',
            '.svg': 'image/svg+xml',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.ico': 'image/x-icon',
        }

        return mime_map.get(ext, 'text/plain')

def run_server():
    print("[DEBUG] run_server() called")
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    print("[DEBUG] Changing directory to:", script_dir)
    os.chdir(script_dir)
    print("[DEBUG] Current directory:", os.getcwd())

    handler = MyHTTPRequestHandler

    try:
        with socketserver.TCPServer(("", PORT), handler) as httpd:
            print("=" * 49)
            print("=" * 49)
            print(f"Server running at http://localhost:{PORT}/")
            print("=" * 49)
            print("=" * 49)
            print(f"Press Ctrl+C to stop server")
            print("=" * 49)
            print("")
            print("Files being served from:", os.getcwd())
            print("")
            print(f"Open http://localhost:{PORT}/ in your browser")
            print("")

            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print("\n" + "=" * 49)
                print("Server stopped.")
                sys.exit(0)
    except OSError as e:
        print(f"[ERROR] Failed to start server: {e}")
        print(f"[ERROR] Port {PORT} might already be in use")
        sys.exit(1)

print("[DEBUG] Defining __name__ == '__main__' check")

if __name__ == "__main__":
    print("[DEBUG] __name__ is '__main__', calling run_server()")
    run_server()
else:
    print(f"[DEBUG] __name__ is: {__name__}, NOT running server")
