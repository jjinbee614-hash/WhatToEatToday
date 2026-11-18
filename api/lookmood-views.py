from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse
from urllib.request import Request, urlopen
import os, json, re

URL = os.environ.get("UPSTASH_REDIS_REST_URL") or os.environ.get("KV_REST_API_URL")
TOKEN = os.environ.get("UPSTASH_REDIS_REST_TOKEN") or os.environ.get("KV_REST_API_TOKEN")

def redis(command):
    if not URL or not TOKEN: raise RuntimeError("not configured")
    req = Request(URL, data=json.dumps(command).encode(), headers={"Authorization": "Bearer " + TOKEN, "Content-Type": "application/json"}, method="POST")
    with urlopen(req, timeout=5) as response:
        result = json.load(response)
    if "error" in result: raise RuntimeError("storage failure")
    return result.get("result")

class handler(BaseHTTPRequestHandler):
    def respond(self, status, data):
        body=json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)
    def do_GET(self):
        try:
            raw=redis(["HGETALL", "lookmood:views"]) or []
            views={raw[i]:int(raw[i+1]) for i in range(0,len(raw),2)} if isinstance(raw,list) else raw
            self.respond(200, {"views":views})
        except Exception:
            self.respond(503, {"error":"views unavailable"})
    def do_POST(self):
        try:
            if int(self.headers.get("Content-Length", "0")) > 512: return self.respond(413,{"error":"invalid request"})
            data=json.loads(self.rfile.read(int(self.headers.get("Content-Length", "0"))))
            page=data.get("id", "")
            session=data.get("session", "")
            if not re.fullmatch(r"(?:[0-9]{3}|bonus-halloween|wedding-guest|berghaus|berghaus-camping|pilot-fur)",page) or not re.fullmatch(r"[a-f0-9]{32}",session): return self.respond(400,{"error":"invalid request"})
            script="if redis.call('SET',KEYS[2],'1','NX','EX',1800) then return redis.call('HINCRBY',KEYS[1],ARGV[1],1) else return tonumber(redis.call('HGET',KEYS[1],ARGV[1]) or 0) end"
            count=redis(["EVAL",script,"2","lookmood:views","lookmood:visit:"+page+":"+session,page])
            self.respond(200,{"views":int(count)})
        except Exception:
            self.respond(503,{"error":"views unavailable"})
