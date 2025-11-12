from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
import json
import html
import os

app = Flask(__name__)
CORS(app)

RESCUE_API_URL = "https://api.rescuegroups.org/http/v2.json"
API_KEY = os.getenv("API_KEY")

# 🐾 Search cats by city/state
@app.route("/api/search_cats", methods=["GET"])
def search_cats():
    city = request.args.get("city", "").strip()
    state = request.args.get("state", "").strip().upper()
    limit = int(request.args.get("limit", 9))
    page = int(request.args.get("page", 1))
    result_start = (page - 1) * limit

    filters = [
        {"fieldName": "animalSpecies", "operation": "equals", "criteria": "Cat"},
        {"fieldName": "animalStatus", "operation": "equals", "criteria": "Available"},
    ]

    # 🏙️ Location filters
    if city and state:
        filters.append({
            "fieldName": "animalLocationCitystate",
            "operation": "contains",
            "criteria": f"{city}, {state}"
        })
    elif city:
        filters.append({
            "fieldName": "animalLocationCitystate",
            "operation": "contains",
            "criteria": city
        })
    elif state:
        filters.append({
            "fieldName": "animalLocationState",
            "operation": "equals",
            "criteria": state
        })

    payload = {
        "apikey": API_KEY,
        "objectType": "animals",
        "objectAction": "publicSearch",
        "search": {
            "resultStart": result_start,
            "resultLimit": limit,
            "fields": [
                "animalID",
                "animalName",
                "animalBreed",
                "animalColor",
                "animalSex",
                "animalLocationCitystate",
                "animalPictures",
                "animalDescriptionPlain",
                "animalAvailableDate",
                "animalUpdatedDate"
            ],
            "filters": filters
        }
    }

    print("📤 Sending search payload:")
    print(json.dumps(payload, indent=2))

    try:
        res = requests.post(RESCUE_API_URL, json=payload)
        data = res.json()

        if not data.get("data"):
            return jsonify({"cats": [], "has_more": False})

        cats = []
        for record in data["data"].values():
            pictures = record.get("animalPictures")
            image_url = None
            if isinstance(pictures, list) and len(pictures) > 0:
                image_url = pictures[0].get("urlSecureFullsize") or pictures[0].get("urlInsecureFullsize")

            cats.append({
                "id": record.get("animalID"),
                "name": record.get("animalName"),
                "breed": record.get("animalBreed"),
                "color": record.get("animalColor"),
                "sex": record.get("animalSex"),
                "image": image_url,
                "description": html.unescape(record.get("animalDescriptionPlain") or ""),
                "location": record.get("animalLocationCitystate"),
                "animalAvailableDate": record.get("animalAvailableDate"),
                "animalUpdatedDate": record.get("animalUpdatedDate")
            })

        # 🐾 Debug print in terminal for date fields
        print("\n📅 Cats with Available or Updated Dates:")
        for c in cats:
            if c.get("animalAvailableDate") or c.get("animalUpdatedDate"):
                print(f" - {c.get('name', 'Unnamed')} | "
                      f"Available: {c.get('animalAvailableDate', 'N/A')} | "
                      f"Updated: {c.get('animalUpdatedDate', 'N/A')}")
        print("🔹 Total cats with date info:", 
              len([c for c in cats if c.get('animalAvailableDate') or c.get('animalUpdatedDate')]))
        print("🔹 Total cats returned:", len(cats), "\n")

        has_more = len(cats) >= limit
        return jsonify({"cats": cats, "has_more": has_more})

    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/cat/<cat_id>", methods=["GET"])
def get_cat_details(cat_id):
    # Step 1️⃣: Fetch cat details
    cat_payload = {
        "apikey": API_KEY,
        "objectType": "animals",
        "objectAction": "publicSearch",
        "search": {
            "resultStart": 0,
            "resultLimit": 1,
            "fields": [
                "animalID", "animalName", "animalBreed", "animalColor",
                "animalSex", "animalAgeString", "animalEnergyLevel",
                "animalOKWithCats", "animalOKWithDogs", "animalOKWithKids",
                "animalDescriptionPlain", "animalLocationCitystate",
                "animalMicrochipped", "animalAltered", "animalSpecialneeds",
                "animalSpecialneedsDescription", "animalOrgID", "animalOrgName",
                "animalPictures", "animalUrl"
            ],
            "filters": [
                {"fieldName": "animalID", "operation": "equals", "criteria": cat_id}
            ]
        }
    }

    try:
        cat_res = requests.post(RESCUE_API_URL, json=cat_payload)
        cat_data = cat_res.json()

        if not cat_data.get("data"):
            return jsonify({"error": "Cat not found"}), 404

        record = list(cat_data["data"].values())[0]
        org_id = record.get("animalOrgID")

        # 🐱 Format cat info
        pictures = record.get("animalPictures")
        image_url = None
        if isinstance(pictures, list) and len(pictures) > 0:
            image_url = pictures[0].get("urlSecureFullsize") or pictures[0].get("urlInsecureFullsize")

        cat_details = {
            "id": record.get("animalID"),
            "name": record.get("animalName"),
            "breed": record.get("animalBreed"),
            "color": record.get("animalColor"),
            "sex": record.get("animalSex"),
            "age": record.get("animalAgeString"),
            "energy_level": record.get("animalEnergyLevel"),
            "ok_with_cats": record.get("animalOKWithCats"),
            "ok_with_dogs": record.get("animalOKWithDogs"),
            "ok_with_kids": record.get("animalOKWithKids"),
            "microchipped": record.get("animalMicrochipped"),
            "altered": record.get("animalAltered"),
            "special_needs": record.get("animalSpecialneeds"),
            "special_needs_desc": record.get("animalSpecialneedsDescription"),
            "description": html.unescape(record.get("animalDescriptionPlain") or ""),
            "location": record.get("animalLocationCitystate"),
            "link": record.get("animalUrl"),
            "image": image_url,
            "shelter": {"name": record.get("animalOrgName", "Unknown Shelter")}
        }

        # Step 2️⃣: Fetch shelter info (if org_id exists)
        if org_id:
            org_payload = {
                "apikey": API_KEY,
                "objectType": "orgs",
                "objectAction": "publicSearch",
                "search": {
                    "resultStart": 0,
                    "resultLimit": 1,
                    "fields": [
                        "orgName", "orgLocationCity", "orgLocationState",
                        "orgLocationPostalcode", "orgPhone", "orgEmail", "orgUrl"
                    ],
                    "filters": [
                        {"fieldName": "orgID", "operation": "equals", "criteria": org_id}
                    ]
                }
            }

            org_res = requests.post(RESCUE_API_URL, json=org_payload)
            org_data = org_res.json()

            if org_data.get("data"):
                org_record = list(org_data["data"].values())[0]
                cat_details["shelter"].update({
                    "city": org_record.get("orgLocationCity"),
                    "state": org_record.get("orgLocationState"),
                    "zip": org_record.get("orgLocationPostalcode"),
                    "phone": org_record.get("orgPhone"),
                    "email": org_record.get("orgEmail"),
                    "website": org_record.get("orgUrl")
                })

        return jsonify(cat_details)

    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/data/<path:filename>")
def serve_data(filename):
    data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
    return send_from_directory(data_dir, filename)


if __name__ == "__main__":
    app.run(port=5050, debug=True)
