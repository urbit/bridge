import BaseHTTPServer, SimpleHTTPServer
import os
import ssl

httpd = BaseHTTPServer.HTTPServer(('localhost', 4443), SimpleHTTPServer.SimpleHTTPRequestHandler)
httpd.socket = ssl.wrap_socket (httpd.socket, certfile='localhost.pem', keyfile='localhost-key.pem', server_side=True)
httpd.serve_forever()
