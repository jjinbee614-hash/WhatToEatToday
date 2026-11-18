from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse
from urllib.request import Request, urlopen
import os, json, re

# GA4 page_view counts through 2026-11-17 (Asia/Seoul); summed by canonical page path.
HISTORICAL_VIEWS = {"001": 59, "002": 31, "003": 52, "004": 51, "005": 61, "006": 27, "007": 27, "008": 23, "009": 30, "010": 36, "011": 27, "012": 28, "013": 20, "014": 28, "015": 31, "016": 15, "017": 31, "018": 16, "019": 19, "020": 20, "021": 14, "022": 14, "023": 13, "024": 18, "025": 6, "026": 18, "027": 20, "028": 27, "029": 27, "030": 40, "031": 37, "032": 6, "033": 4, "034": 15, "035": 7, "037": 3, "038": 1, "berghaus": 90, "berghaus-camping": 16, "bonus-halloween": 24, "pilot-fur": 30, "wedding-guest": 4}

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
            views = {key: int(views.get(key, 0)) + HISTORICAL_VIEWS.get(key, 0) for key in set(views) | set(HISTORICAL_VIEWS)}
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
            self.respond(200,{"views":int(count) + HISTORICAL_VIEWS.get(page, 0)})
        except Exception:
            self.respond(503,{"error":"views unavailable"})
