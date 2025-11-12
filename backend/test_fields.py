import requests, json

API_KEY = "JGQGxHLj"
url = "https://api.rescuegroups.org/http/v2.json"

payload = {
    "apikey": API_KEY,
    "objectType": "animals",
    "objectAction": "define"
}

resp = requests.post(url, json=payload, headers={"Content-Type": "application/json"})
data = resp.json()

print(json.dumps(data, indent=2))