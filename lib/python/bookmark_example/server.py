#!/usr/bin/env python

from SimpleHTTPServer import SimpleHTTPRequestHandler
import SocketServer
import urlparse, os, posixpath, urllib, sys

global PUB_PATH;

PUB_PATH = os.path.abspath( os.path.dirname( os.path.realpath(__file__) ) + "/../../../public/bookmark_example");

PORT = 3000
INDEXFILE = PUB_PATH + '/index.html'

class MyHandler(SimpleHTTPRequestHandler):

   do_POST = SimpleHTTPRequestHandler.do_GET

   def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Allow', 'GET,HEAD,POST,OPTIONS')
        self.end_headers()

   def translate_path(self, path):
        # abandon query parameters
        path = path.split('?',1)[0]
        path = path.split('#',1)[0]
        path = posixpath.normpath(urllib.unquote(path))
        words = path.split('/')
        words = filter(None, words)

        document_root = os.path.abspath(self.server.document_root)
        index = os.path.join(document_root, 'index.html')
        filepath = os.path.abspath(os.path.join(document_root, *words))

        if not os.path.isfile(filepath):
            return index

        elif not filepath.startswith(document_root):
            return index

        else:
            return filepath

class HTTPServer(SocketServer.TCPServer):

    allow_reuse_address = True

    def __init__(self, document_root, port, handler):
        self.document_root = document_root
        SocketServer.TCPServer.__init__(
            self, ('localhost', port), handler)

Handler = MyHandler

httpd = HTTPServer(PUB_PATH, PORT, Handler)

print "serving at port", PORT
httpd.serve_forever()
