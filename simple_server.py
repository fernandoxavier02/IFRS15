#!/usr/bin/env python3
import http.server
import socketserver
import json
import os
from urllib.parse import urlparse, parse_qs

PORT = 3000

class IFRS15Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=".", **kwargs)
    
    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        # API endpoints
        if parsed_path.path.startswith('/api/v1/'):
            self.handle_api(parsed_path.path)
            return
        
        # Serve demo page for all routes
        if parsed_path.path == '/' or parsed_path.path in ['/dashboard', '/contracts', '/revenue']:
            self.path = '/demo-static.html'
        
        return super().do_GET()
    
    def handle_api(self, path):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        if path == '/api/v1/health':
            response = {
                "status": "healthy",
                "timestamp": "2024-08-28T22:10:00-03:00",
                "version": "1.0.0",
                "service": "IFRS 15 API"
            }
        elif path == '/api/v1/contracts':
            response = {
                "data": [
                    {
                        "id": "CTR-001",
                        "customer": "Empresa ABC Ltda",
                        "value": 150000,
                        "status": "ativo",
                        "startDate": "2024-01-15"
                    },
                    {
                        "id": "CTR-002", 
                        "customer": "Corporação XYZ S.A.",
                        "value": 280000,
                        "status": "em_andamento",
                        "startDate": "2024-02-01"
                    }
                ],
                "total": 2
            }
        elif path == '/api/v1/revenue':
            response = {
                "data": {
                    "totalRecognized": 2450000,
                    "totalPending": 525000,
                    "performanceObligations": [
                        {
                            "contract": "CTR-001",
                            "description": "Desenvolvimento de Software",
                            "allocatedPrice": 100000,
                            "progress": 75,
                            "recognizedRevenue": 75000
                        }
                    ]
                }
            }
        else:
            response = {"error": "Endpoint not found"}
        
        self.wfile.write(json.dumps(response, indent=2).encode())

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), IFRS15Handler) as httpd:
        print(f"🚀 IFRS 15 Development Server running at http://localhost:{PORT}")
        print(f"📊 Dashboard: http://localhost:{PORT}/dashboard")
        print(f"📋 Contracts: http://localhost:{PORT}/contracts") 
        print(f"💰 Revenue: http://localhost:{PORT}/revenue")
        print(f"🔍 API Health: http://localhost:{PORT}/api/v1/health")
        httpd.serve_forever()
