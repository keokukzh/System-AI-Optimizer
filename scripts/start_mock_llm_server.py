#!/usr/bin/env python3
"""
Start mock LLM server for OptiAI development
This simulates the llama.cpp server API
"""

import http.server
import socketserver
import json
import sys
import os
from urllib.parse import urlparse, parse_qs

class OptiAIServer(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Suppress default logging
        pass
    
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {'status': 'ok', 'model': 'phi3-mini-dev'}
            self.wfile.write(json.dumps(response).encode())
        elif self.path == '/props':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {
                'status': 'ok',
                'model': 'phi3-mini-dev',
                'size': '2.3GB',
                'license': 'MIT'
            }
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_POST(self):
        if self.path == '/completion':
            # Read request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                request_data = json.loads(post_data.decode('utf-8'))
                prompt = request_data.get('prompt', '')
                
                # Generate mock response based on prompt
                response_content = generate_mock_response(prompt)
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                
                response = {
                    'content': response_content,
                    'stop': False,
                    'generation_settings': {
                        'temperature': 0.1,
                        'max_tokens': 2048
                    }
                }
                
                self.wfile.write(json.dumps(response).encode())
                
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                error_response = {'error': str(e)}
                self.wfile.write(json.dumps(error_response).encode())
        else:
            self.send_response(404)
            self.end_headers()

def generate_mock_response(prompt):
    """Generate a mock AI response for system optimization"""
    
    # Check if this is a system optimization request
    if 'system scan' in prompt.lower() or 'optimization' in prompt.lower():
        return '''{
  "actions": [
    {
      "action": "send_to_trash",
      "target": "temp_files",
      "reason": "Temporary files can be safely removed to free up disk space",
      "risk": "low",
      "estimated_savings": 104857600
    },
    {
      "action": "compress",
      "target": "large_documents",
      "reason": "Large documents can be compressed to save significant space",
      "risk": "low",
      "estimated_savings": 524288000
    },
    {
      "action": "move",
      "target": "old_downloads",
      "reason": "Old downloads can be moved to archive folder",
      "risk": "low",
      "estimated_savings": 209715200,
      "dest": "C:\\\\Users\\\\Archive\\\\Downloads"
    }
  ],
  "summary": {
    "total_savings": 838860800,
    "risk_level": "low",
    "action_count": 3
  }
}'''
    else:
        return '''{
  "actions": [
    {
      "action": "ignore",
      "target": "system_files",
      "reason": "System files should not be modified",
      "risk": "high",
      "estimated_savings": 0
    }
  ],
  "summary": {
    "total_savings": 0,
    "risk_level": "high",
    "action_count": 0
  }
}'''

if __name__ == "__main__":
    PORT = 11435
    print(f'OptiAI Mock LLM Server starting on http://127.0.0.1:{PORT}')
    print('Press Ctrl+C to stop')
    
    try:
        with socketserver.TCPServer(('127.0.0.1', PORT), OptiAIServer) as httpd:
            print(f'Server running on http://127.0.0.1:{PORT}')
            httpd.serve_forever()
    except KeyboardInterrupt:
        print('\nServer stopped')
    except Exception as e:
        print(f'Error starting server: {e}')
        sys.exit(1)
