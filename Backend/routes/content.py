from flask import Blueprint, request, jsonify
from services.connectDB import connect_db
import json
import os

content_routes = Blueprint("content_routes", __name__)


# ---------------------------------------------------------
# ADD CONTENT (existing)
# ---------------------------------------------------------
@content_routes.route("/content", methods=["POST"])
def add_content():
    db = connect_db()
    data = request.json

    if not data:
        return jsonify({"success": False, "message": "No input data"}), 400

    result = db.Content.insert_one(data)

    return jsonify({
        "success": True,
        "message": "Content added successfully",
        "id": str(result.inserted_id)
    }), 201


# ---------------------------------------------------------
# GET ALL CONTENT (existing)
# ---------------------------------------------------------
@content_routes.route("/content/all", methods=["GET"])
def get_content():
    db = connect_db()
    content_list = list(db.Content.find())

    for c in content_list:
        c["_id"] = str(c["_id"])

    return jsonify(content_list), 200

# ---------------------------------------------------------
# GET CONTENT BY ID (existing)
# ---------------------------------------------------------

@content_routes.route("/content/<string:id>", methods=["GET"])
def get_content_by_id(id):
    db = connect_db()
    content = db.Content.find_one({"_id": id})

    if content:
        content["_id"] = str(content["_id"])
        return jsonify(content), 200
    else:
        return jsonify({"success": False, "message": "Content not found"}), 404 

    return jsonify(content_list), 200



# ---------------------------------------------------------
# NEW ROUTE: UPLOAD COURSE JSON → Course COLLECTION
# ---------------------------------------------------------
@content_routes.route("/content/upload-courses", methods=["POST"])
def upload_courses_json():
    db = connect_db()

    # Path to your generated JSON file
    JSON_PATH = r"C:\Users\LOQ\Desktop\New folder (3)\ApniDisha\web\Backend\data\college_courses_output2.json"

    # Check file exists
    if not os.path.exists(JSON_PATH):
        return jsonify({"success": False, "message": "JSON file not found"}), 404

    # Load JSON data
    try:
        with open(JSON_PATH, "r", encoding="utf-8") as f:
            colleges = json.load(f)
    except Exception as e:
        return jsonify({"success": False, "message": f"Invalid JSON: {e}"}), 400

    # Create unique index for AISHE_code
    db.Course.create_index("AISHE_code", unique=True)

    inserted = 0
    updated = 0

    # Iterate over colleges and upsert into MongoDB
    for college in colleges:
        aishe = college.get("AISHE_code")

        if not aishe:
            continue

        result = db.Course.update_one(
            {"AISHE_code": aishe},
            {"$set": college},
            upsert=True
        )

        if result.upserted_id:
            inserted += 1
        else:
            updated += 1

    return jsonify({
        "success": True,
        "message": "Course data uploaded successfully",
        "inserted": inserted,
        "updated": updated
    }), 201
