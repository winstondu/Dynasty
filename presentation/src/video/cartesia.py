"""Minimal Cartesia client: reads CARTESIA_API_KEY from the repo's .env."""
import json, os, sys, urllib.request

ENV = os.environ.get("DYNASTY_ENV", "/Users/winstondu/Documents/SideProjects/Dynasty/.env")
KEY = next(l.split("=", 1)[1].strip().strip('"\'') for l in open(ENV) if l.startswith("CARTESIA_API_KEY="))
BASE, VERSION = "https://api.cartesia.ai", "2025-04-16"

def call(method, path, body=None):
    req = urllib.request.Request(BASE + path, method=method,
        data=json.dumps(body).encode() if body else None,
        headers={"X-API-Key": KEY, "Cartesia-Version": VERSION, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()

if __name__ == "__main__" and sys.argv[1] == "voices":
    data = json.loads(call("GET", "/voices?limit=100&language=en"))
    for v in data.get("data", data):
        print(v["id"], "|", v["name"], "|", (v.get("description") or "")[:70])
