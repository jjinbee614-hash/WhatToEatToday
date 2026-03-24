from http.server import BaseHTTPRequestHandler
import urllib.request
import urllib.parse
import json

KAKAO_REST_API_KEY = "53180283ed6cb75cf82b8371ec4abde6"

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            parsed = urllib.parse.urlparse(self.path)
            params = urllib.parse.parse_qs(parsed.query)

            query  = params.get("query",  [""])[0]
            x      = params.get("x",      [""])[0]
            y      = params.get("y",      [""])[0]
            radius = params.get("radius", ["1000"])[0]
            size   = params.get("size",   ["15"])[0]

            api_url = "https://dapi.kakao.com/v2/local/search/keyword.json"
            qs = urllib.parse.urlencode({
                "query": query, "x": x, "y": y,
                "radius": radius, "size": size, "sort": "distance"
            })
            req = urllib.request.Request(
                f"{api_url}?{qs}",
                headers={"Authorization": f"KakaoAK {KAKAO_REST_API_KEY}"}
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))

            self._send(200, data)
        except Exception as e:
            self._send(500, {"error": str(e), "documents": []})

    def do_OPTIONS(self):
        self._send(200, {})

    def _send(self, code, data):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.end_headers()
        self.wfile.write(body)
