import uuid
from flask import Flask, jsonify, request, send_from_directory, session
from config import MongoDB, oid
from bson import ObjectId
from flask_cors import CORS
from datetime import datetime, date, timedelta
import os
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from bson.errors import InvalidId


app = Flask(__name__)
UPLOAD_FOLDER = "uploads"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

CORS(
    app,
    resources={r"/*": {"origins": "http://localhost:5173"}},
    supports_credentials=True,
)


# Create MongoDB instance
mongo = MongoDB()


# -------------------------------
# 🔍 TEST MONGODB CONNECTION
# -------------------------------
def create_notification(user_id, user_type, type_, message, mongo):
    """Create a notification for a user"""
    try:
        mongo.db.tbl_notifications.insert_one(
            {
                "user_id": ObjectId(user_id),
                "user_type": user_type,
                "type": type_,  # e.g., 'assignment', 'verify_mom', 'donation'
                "message": message,
                "read": False,
                "created_at": datetime.utcnow(),
            }
        )
    except Exception as e:
        print("NOTIFICATION ERROR:", e)


def format_date(dt):
    return dt.strftime("%d/%m/%Y %I:%M %p")  # 23/03/2026 10:11 PM


@app.route("/")
def home():
    return "API is running"


@app.route("/test-db")
def test_db():
    try:
        # Ping MongoDB server
        mongo.client.admin.command("ping")
        return jsonify(
            {"status": "success", "message": "MongoDB connected successfully!"}
        )
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/uploads/<path:filename>")
def serve_uploads(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


# -----------------------------------------------
# ------------------------------------------
# SINGLE API → insert login first, then user
# ------------------------------------------
@app.route("/register", methods=["POST"])
def register_user():
    try:
        data = request.json

        required_fields = [
            "name",
            "email",
            "contact",
            "address",
            "dob",
            "aadhar",
            "password",
        ]

        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({"error": f"{field} is required"}), 400

        # ✅ Check existing email
        existing = mongo.find_one("tbl_login", {"email": data["email"]})
        if existing:
            return jsonify({"error": "Email already exists"}), 400

        # ✅ Insert login
        login_data = {
            "username": data["email"],
            "email": data["email"],
            "password": data["password"],
            "usertype": "mom",
            "created_at": datetime.utcnow(),
        }
        login_id = mongo.insert_one("tbl_login", login_data)

        # ✅ Insert user
        user_data = {
            "name": data["name"],
            "contact": data["contact"],
            "address": data["address"],
            "dob": data["dob"],
            "aadhar": data["aadhar"],
            "login_id": oid(login_id),
            "verification_status": "pending",
            "created_at": datetime.utcnow(),
        }
        user_id = mongo.insert_one("tbl_user", user_data)

        # 🔔 SINGLE NOTIFICATION (NO LOOP)
        mongo.db.tbl_notifications.insert_one(
            {
                "user_type": "socialworker",
                "type": "new_mom_registration",
                "message": f"New mom registered: {data['name']}",
                "completed": False,
                "created_at": datetime.utcnow(),
            }
        )

        return (
            jsonify(
                {
                    "message": "Registration successful",
                    "login_id": str(login_id),
                    "user_id": str(user_id),
                }
            ),
            201,
        )

    except Exception as e:
        print("REGISTER ERROR:", e)
        return jsonify({"error": "Registration failed"}), 500


# ///////////////////////////////////////////////////////////////////


@app.route("/admin/verified-moms", methods=["GET"])
def get_verified_moms():
    try:
        moms_cursor = mongo.db.tbl_user.find({"verification_status": "Verified"})
        moms_list = []

        for mom in moms_cursor:
            # fetch children for this mom
            children = list(
                mongo.db.tbl_children.find({"mom_login_id": mom["login_id"]})
            )
            # format children
            children_data = [
                {
                    "name": c["name"],
                    "age": c.get("age", ""),
                    "gender": c.get("gender", ""),
                    "is_school_going": c.get("is_school_going", False),
                    "school_name": c.get("school_name", ""),
                    "class": c.get("class", ""),
                    "birth_certificate_path": c.get("birth_certificate_path", ""),
                }
                for c in children
            ]

            moms_list.append(
                {
                    "_id": str(mom["_id"]),
                    "name": mom["name"],
                    "contact": mom.get("contact", ""),
                    "address": mom.get("address", ""),
                    "dob": mom.get("dob", ""),
                    "aadhar": mom.get("aadhar", ""),
                    "login_id": str(mom["login_id"]),
                    "created_at": mom.get("created_at"),
                    "children": children_data,
                }
            )

        return jsonify(moms_list), 200

    except Exception as e:
        print(e)
        return jsonify({"message": "Internal server error"}), 500


# ------------------------------------------
# JOB PROVIDER REGISTRATION API
# ------------------------------------------
@app.route("/register-jobprovider", methods=["POST"])
def register_jobprovider():
    data = request.json or {}

    required = [
        "company_name",
        "organization_type",
        "email",
        "phone",
        "address",
        "password",
    ]

    if not all(field in data and data[field] for field in required):
        return jsonify({"error": "Missing required fields"}), 400

    organization_type = data["organization_type"]

    # 🔹 Validate organization type specific fields
    if organization_type == "Freelancer":
        if not data.get("aadhar"):
            return jsonify({"error": "Aadhar is required for Freelancer"}), 400
        if not data["aadhar"].isdigit() or len(data["aadhar"]) != 12:
            return jsonify({"error": "Invalid Aadhar number"}), 400
    elif organization_type in ["Private", "Government"]:
        if not data.get("license_id"):
            return jsonify({"error": "License ID is required"}), 400
    else:
        return jsonify({"error": "Invalid organization type"}), 400

    username = data["email"]

    existing = mongo.find_one("tbl_login", {"username": username})
    if existing:
        return jsonify({"error": "Job provider already exists"}), 400

    # 1️⃣ Insert login
    login_data = {
        "username": username,
        "password": data["password"],  # ⚠️ hash later
        "usertype": "jobprovider",
        "email": data["email"],
        "status": "Pending",  # optional: show pending till admin approves
    }
    login_id = mongo.insert_one("tbl_login", login_data)

    # 2️⃣ Insert job provider details
    jobprovider_data = {
        "company_name": data["company_name"],
        "organization_type": organization_type,
        "email": data["email"],
        "phone": data["phone"],
        "address": data["address"],
        "company_logo": data.get("company_logo", ""),
        "login_id": oid(login_id),
    }
    if organization_type == "Freelancer":
        jobprovider_data["aadhar"] = data["aadhar"]
    if organization_type in ["Private", "Government"]:
        jobprovider_data["license_id"] = data["license_id"]

    jobprovider_id = mongo.insert_one("tbl_jobprovider", jobprovider_data)

    # 🔔 CREATE NOTIFICATION FOR ADMINS
    mongo.db.tbl_notifications.insert_one(
        {
            "user_type": "admin",  # all admins see this
            "type": "jobprovider_registration",
            "message": f"New job provider registered: {data['company_name']} ({data['email']})",
            "completed": False,
            "created_at": datetime.utcnow(),
        }
    )

    return (
        jsonify(
            {
                "message": "Job Provider registered successfully",
                "login_id": login_id,
                "jobprovider_id": jobprovider_id,
            }
        ),
        201,
    )

@app.route("/mom/login", methods=["POST"])
def mom_login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    login = mongo.db.tbl_login.find_one({"email": email, "usertype": "mom"})

    if not login or login["password"] != password:
        return jsonify({"error": "Invalid credentials"}), 401

    mom = mongo.db.tbl_user.find_one({"login_id": login["_id"]})

    if not mom:
        return jsonify({"error": "Mom profile not found"}), 404

    if mom.get("verification_status") != "Verified":
        return jsonify({"verification_status": "pending"}), 200

    return jsonify(
        {
            "login_id": str(login["_id"]),
            "verification_status": "Verified",
        }
    )

    # \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
    #


@app.route("/login", methods=["POST"])
def login_user():
    data = request.json or {}

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    user = mongo.find_one("tbl_login", {"email": email})

    if not user or user["password"] != password:
        return jsonify({"error": "Invalid email or password"}), 401

    # 🔴 Approval check ONLY for charity providers
    if user["usertype"] == "charityprovider":
        if user.get("status") != "Approved":
            return (
                jsonify(
                    {
                        "error": "Your account is not approved yet. Please wait for admin approval."
                    }
                ),
                403,
            )
    if user["usertype"] == "jobprovider":
        if user.get("status") != "Approved":
            return (
                jsonify(
                    {
                        "error": "Your account is not approved yet. Please wait for admin approval."
                    }
                ),
                403,
            )

    # ✅ Success
    return (
        jsonify(
            {
                "message": "Login successful",
                "login_id": str(user["_id"]),
                "usertype": user["usertype"],
                "email": user["email"],
            }
        ),
        200,
    )


# ------------------------------------------
# CHARITY PROVIDER REGISTRATION API
# ------------------------------------------
@app.route("/register-charityprovider", methods=["POST"])
def register_charityprovider():
    data = request.json or {}

    required = ["organization_name", "address", "email", "phone", "aadhar", "password"]

    if not all(field in data and data[field] for field in required):
        return jsonify({"error": "Missing required fields"}), 400

    username = data["email"]

    existing = mongo.find_one("tbl_login", {"username": username})
    if existing:
        return jsonify({"error": "Charity provider already exists"}), 400

    # 🔐 Insert login
    login_data = {
        "username": username,
        "password": data["password"],
        "usertype": "charityprovider",
        "email": data["email"],
        "status": "Pending",
    }
    login_id = mongo.insert_one("tbl_login", login_data)

    # 🏢 Insert charity details
    charity_data = {
        "organization_name": data["organization_name"],
        "address": data["address"],
        "email": data["email"],
        "phone": data["phone"],
        "aadhar": data["aadhar"],
        "login_id": oid(login_id),
    }
    charity_id = mongo.insert_one("tbl_charityprovider", charity_data)

    # 🔔 CREATE NOTIFICATION FOR ADMINS
    mongo.db.tbl_notifications.insert_one(
        {
            "user_type": "admin",  # common notification for all admins
            "type": "charity_registration",
            "message": f"New charity provider registered: {data['organization_name']} ({data['email']})",
            "completed": False,  # not read yet
            "created_at": datetime.utcnow(),
        }
    )

    return (
        jsonify(
            {
                "message": "Charity Provider registered successfully",
                "login_id": login_id,
                "charity_id": charity_id,
            }
        ),
        201,
    )

# --------------------------------------------------------

@app.route("/jobprovider/add-job", methods=["POST"])
def add_job():
    try:
        data = request.json or {}

        required_fields = [
            "title",
            "description",
            "jobType",
            "skills",
            "lastDate",
            "login_id",
        ]

        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({"error": f"{field} is required"}), 400

        # ✅ DATE VALIDATION (SAFE)
        today = date.today()
        last_date = datetime.strptime(data["lastDate"], "%Y-%m-%d").date()

        if last_date <= today:
            return jsonify({"error": "Last date must be after today"}), 400

        # ✅ INSERT JOB (STORE AS datetime)
        job_data = {
            "title": data["title"],
            "description": data["description"],
            "jobType": data["jobType"],
            "skills": data["skills"],
            "salary": data.get("salary", ""),
            "postDate": datetime.utcnow(),  # ✅ backend-controlled
            "lastDate": datetime.combine(last_date, datetime.min.time()),
            "login_id": oid(data["login_id"]),
            "created_at": datetime.utcnow(),
            "status": "pending",
        }

        job_id = mongo.insert_one("tbl_jobs", job_data)

        # 🔔 CREATE NOTIFICATION FOR ADMIN
        mongo.db.tbl_notifications.insert_one(
            {
                "user_type": "admin",
                "type": "job_post_request",
                "message": f"New job posted by Job Provider ID {data['login_id']} (Job ID: {job_id}) awaiting approval",
                "completed": False,
                "created_at": datetime.utcnow(),
            }
        )

        return jsonify({"message": "Job added successfully", "job_id": job_id}), 201

    except Exception as e:
        print("❌ Error adding job:", e)
        return jsonify({"error": "Internal server error"}), 500

# -------------------------------------------------------------------


# -------------------------------------------------------------------------
@app.route("/users", methods=["GET"])
def list_users():
    users = mongo.find_all("tbl_user")  # ⭐ FIXED

    fixed_users = []

    for u in users:
        u["_id"] = str(u["_id"])

        login_id = u.get("login_id")

        if isinstance(login_id, str):
            login_id = oid(login_id)

        if login_id:
            login_ref = mongo.find_one("tbl_login", {"_id": login_id})  # ⭐ FIXED
            if login_ref:
                login_ref["_id"] = str(login_ref["_id"])
        else:
            login_ref = None

        u["login_details"] = login_ref
        fixed_users.append(u)

    return jsonify(fixed_users)


# --------------------------------------------------------------------------
@app.route("/jobs/<login_id>", methods=["GET"])
def get_jobs_by_provider(login_id):
    try:
        jobs = mongo.find_all(
            "tbl_jobs", {"login_id": oid(login_id), "status": {"$ne": "Deleted"}}
        )

        for job in jobs:
            job["_id"] = str(job["_id"])
            job["login_id"] = str(job["login_id"])
            job["postDate"] = job["postDate"].strftime("%Y-%m-%d")
            job["lastDate"] = job["lastDate"].strftime("%Y-%m-%d")

        return jsonify(jobs), 200

    except Exception as e:
        print("Error fetching jobs:", e)
        return jsonify({"error": "Failed to fetch jobs"}), 500


# -----------------------------------------------------------------------------

@app.route("/api/job-providers", methods=["GET"])
def get_all_job_providers():
    try:
        # Fetch all login entries for job providers
        logins = list(
            mongo.db.tbl_login.find({"usertype": "jobprovider"}, {"password": 0})
        )

        providers = []
        for login in logins:
            login_id = login["_id"]
            profile = mongo.db.tbl_jobprovider.find_one({"login_id": login_id})

            # If profile exists, merge data
            if profile:
                profile_data = {
                    "_id": str(login_id),
                    "email": login.get("email", "—"),
                    "status": login.get("status", "Pending"),
                    "company_name": profile.get("company_name", "—"),
                    "organization_type": profile.get("organization_type", "—"),
                    "license_id": profile.get("license_id", "—"),
                }
                providers.append(profile_data)
            else:
                # If profile missing, still include login info
                providers.append(
                    {
                        "_id": str(login_id),
                        "email": login.get("email", "—"),
                        "status": login.get("status", "Pending"),
                        "company_name": "—",
                        "organization_type": "—",
                        "license_id": "—",
                    }
                )

        return jsonify({"data": providers}), 200

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": "Failed to fetch job providers"}), 500


# //////////////////////////////////////////////////////////////////////////////////////
@app.route("/job-provider/profile/<login_id>", methods=["GET", "PUT"])
def job_provider_profile(login_id):
    try:
        if request.method == "GET":
            provider = mongo.db.tbl_jobprovider.find_one({
                "login_id": ObjectId(login_id)
            })

            if not provider:
                return jsonify({"error": "Profile not found"}), 404

            return jsonify({
                "company_name": provider.get("company_name", ""),
                "organization_type": provider.get("organization_type", ""),
                "email": provider.get("email", ""),
                "phone": provider.get("phone", ""),
                "address": provider.get("address", ""),
                "license_id": provider.get("license_id", ""),
                "aadhar": provider.get("aadhar", ""),
            }), 200

        elif request.method == "PUT":
            data = request.json

            result = mongo.db.tbl_jobprovider.update_one(
                {"login_id": ObjectId(login_id)},
                {
                    "$set": {
                        "company_name": data.get("company_name"),
                        "organization_type": data.get("organization_type"),
                        "phone": data.get("phone"),
                        "address": data.get("address"),
                        "license_id": data.get("license_id"),
                        "aadhar": data.get("aadhar"),
                    }
                },
            )

            if result.matched_count == 0:
                return jsonify({"message": "Profile not found"}), 404

            return jsonify({"message": "Profile updated successfully"}), 200

    except Exception as e:
        print("PROFILE ERROR:", e)
        return jsonify({"error": "Server error"}), 500
# ------------------------------------------------------------------------------


@app.route("/job-provider/change-password/<login_id>", methods=["PUT"])
def change_password(login_id):
    try:
        data = request.json or {}

        current_password = data.get("currentPassword")
        new_password = data.get("newPassword")
        confirm_password = data.get("confirmPassword")

        if not current_password or not new_password or not confirm_password:
            return jsonify({"error": "All fields are required"}), 400

        if new_password != confirm_password:
            return jsonify({"error": "Passwords do not match"}), 400

        # ✅ FIND USER
        user = mongo.find_one("tbl_login", {"_id": ObjectId(login_id)})

        if not user:
            return jsonify({"error": "User not found"}), 404

        # ✅ CHECK CURRENT PASSWORD (PLAIN)
        if user["password"] != current_password:
            return jsonify({"error": "Current password is incorrect"}), 401

        # ✅ UPDATE PASSWORD (DEFINE result HERE)
        result = mongo.db.tbl_login.update_one(
            {"_id": ObjectId(login_id)}, {"$set": {"password": new_password}}
        )

        # ✅ NOW SAFE TO USE result
        if result.matched_count == 0:
            return jsonify({"error": "Password update failed"}), 400

        return jsonify({"message": "Password updated successfully"}), 200

    except Exception as e:
        print("CHANGE PASSWORD ERROR:", e)
        return jsonify({"error": "Something went wrong"}), 500


# ---------------------------------------------------
# CHARITY → ADD DONATION
# ---------------------------------------------------
@app.route("/charity/donate", methods=["POST"])
def add_donation():
    try:
        data = request.json or {}

        charity_login_id = data.get("login_id")
        items = data.get("items")
        delivery_mode = data.get("delivery_mode")
        pickup_address = data.get("pickup_address", "").strip()
        drop_center = data.get("drop_center", "").strip()

        if not charity_login_id or not items or not delivery_mode:
            return jsonify({"error": "Invalid donation data"}), 400

        if delivery_mode == "pickup" and not pickup_address:
            return jsonify({"error": "Pickup address is required"}), 400
        if delivery_mode == "drop" and not drop_center:
            return jsonify({"error": "Collection center is required"}), 400

        # Insert donation
        donation_data = {
            "charity_login_id": ObjectId(charity_login_id),
            "items": items,
            "delivery_mode": delivery_mode,
            "pickup_address": pickup_address if delivery_mode == "pickup" else "",
            "drop_center": drop_center if delivery_mode == "drop" else "",
            "status": "pending",
            "created_at": datetime.utcnow(),
        }

        donation_id = mongo.db.tbl_donations.insert_one(donation_data).inserted_id

        # 🔔 Notify all social workers (handled_by empty initially)
        mongo.db.tbl_notifications.insert_one(
            {
                "user_type": "socialworker",
                "type": "donation_assignment",
                "message": f"New donation submitted by charity ID {charity_login_id}",
                "completed": False,
                "created_at": datetime.utcnow(),
            }
        )

        print("Notification created successfully.")

        return (
            jsonify(
                {
                    "message": "Donation submitted successfully",
                    "donation_id": str(donation_id),
                }
            ),
            201,
        )

    except Exception as e:
        print("DONATION ERROR:", e)
        return jsonify({"error": "Failed to submit donation"}), 500


@app.route("/charity/my-donations/<login_id>", methods=["GET"])
def get_my_donations(login_id):
    try:
        donations = mongo.db.tbl_donations.find(
            {"charity_login_id": ObjectId(login_id)}
        ).sort("created_at", -1)

        result = []
        for d in donations:
            result.append(
                {
                    "id": str(d["_id"]),
                    "items": d.get("items", []),
                    "delivery_mode": d.get("delivery_mode", ""),
                    "status": d.get("status", ""),
                    "created_at": d.get("created_at"),
                }
            )

        return jsonify(result), 200

    except Exception as e:
        print("❌ MY DONATIONS ERROR:", e)
        return jsonify({"error": "Failed to fetch donations"}), 500


@app.route("/charity/profile/<login_id>", methods=["GET"])
def get_charity_profile(login_id):
    try:
        charity = mongo.db.tbl_charityprovider.find_one(
            {"login_id": ObjectId(login_id)}
        )

        if not charity:
            return jsonify({"message": "Charity not found"}), 404

        # 🔥 MANUAL CLEAN (THIS FIXES EVERYTHING)
        charity["_id"] = str(charity["_id"])
        charity["login_id"] = str(charity["login_id"])

        return jsonify(charity), 200

    except Exception as e:
        print("SERVER ERROR:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/charity/profile/<login_id>", methods=["PUT"])
def update_charity_profile(login_id):
    data = request.json

    update_data = {
        "organization_name": data.get("organization_name"),
        "phone": data.get("phone"),
        "address": data.get("address"),
        "updated_at": datetime.now(),
    }

    result = mongo.db.tbl_charityprovider.update_one(
        {"login_id": ObjectId(login_id)}, {"$set": update_data}
    )

    if result.matched_count == 0:
        return jsonify({"message": "Charity not found"}), 404

    return jsonify({"message": "Profile updated successfully"}), 200


@app.route("/api/charity-providers", methods=["GET"])
def get_charity_providers():
    # 1️⃣ Get all login entries for charity providers
    login_providers = list(
        mongo.db.tbl_login.find({"usertype": "charityprovider"}, {"password": 0})
    )

    providers = []
    for p in login_providers:
        p["_id"] = str(p["_id"])  # convert ObjectId to string

        # 2️⃣ Fetch the organization_name from tbl_charityprovider
        charity_details = mongo.db.tbl_charityprovider.find_one(
            {
                "login_id": ObjectId(p["_id"])
            }  # assuming you store login_id in tbl_charityprovider
        )
        if charity_details:
            p["name"] = charity_details.get("organization_name", "Unnamed Charity")
        else:
            p["name"] = "Unnamed Charity"

        providers.append(p)

    return jsonify(providers)


# Approve charity provider
@app.route("/api/charity-providers/<id>/approve", methods=["POST"])
def approve_charity(id):
    result = mongo.db.tbl_login.update_one(
        {"_id": ObjectId(id), "usertype": "charityprovider"},
        {"$set": {"status": "Approved"}},
    )
    if result.modified_count:
        return jsonify({"message": "Approved"}), 200
    return jsonify({"message": "No change"}), 400


# Reject charity provider
@app.route("/api/charity-providers/<id>/reject", methods=["POST"])
def reject_charity(id):
    result = mongo.db.tbl_login.update_one(
        {"_id": ObjectId(id), "usertype": "charityprovider"},
        {"$set": {"status": "Rejected"}},
    )
    if result.modified_count:
        return jsonify({"message": "Rejected"}), 200
    return jsonify({"message": "No change"}), 400


# \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


@app.route("/api/job-providers", methods=["GET"])
def get_job_providers():
    providers = list(
        mongo.db.tbl_login.find({"usertype": "jobprovider"}, {"password": 0})
    )  # exclude password
    for p in providers:
        p["_id"] = str(p["_id"])  # convert ObjectId to string
    return jsonify(providers)


# Approve job provider
@app.route("/api/job-providers/<id>/approve", methods=["POST"])
def approve_job(id):
    result = mongo.db.tbl_login.update_one(
        {"_id": ObjectId(id), "usertype": "jobprovider"},
        {"$set": {"status": "Approved"}},
    )
    if result.modified_count:
        return jsonify({"message": "Approved"}), 200
    return jsonify({"message": "No change"}), 400


# Reject job provider
@app.route("/api/job-providers/<id>/reject", methods=["POST"])
def reject_job(id):
    result = mongo.db.tbl_login.update_one(
        {"_id": ObjectId(id), "usertype": "jobprovider"},
        {"$set": {"status": "Rejected"}},
    )
    if result.modified_count:
        return jsonify({"message": "Rejected"}), 200
    return jsonify({"message": "No change"}), 400


# /////////////////////////////////////////////////////////////////////////////////////
@app.route("/admin/charities", methods=["GET"])
def admin_view_charities():
    try:
        charities = list(mongo.db.tbl_donations.find())
        def get_sort_time(c):
            return c.get("collected_at") or c.get("created_at") or datetime.min

        charities.sort(key=get_sort_time, reverse=True)

        result = []

        for c in charities:
            # Fetch login info
            provider_login = mongo.db.tbl_login.find_one(
                {"_id": ObjectId(c["charity_login_id"])}
            )
            # Fetch charity provider details
            provider_details = mongo.db.tbl_charityprovider.find_one(
                {"login_id": ObjectId(c["charity_login_id"])}
            )

            result.append(
                {
                    "id": str(c["_id"]),
                    "provider_email": (
                        provider_login.get("email") if provider_login else "N/A"
                    ),
                    "organization_name": (
                        provider_details.get("organization_name")
                        if provider_details
                        else "N/A"
                    ),
                    "provider_type": (
                        provider_login.get("usertype") if provider_login else "N/A"
                    ),
                    "items": [
                        {"item": i.get("item"), "quantity": i.get("quantity")}
                        for i in c.get("items", [])
                    ],
                    "status": c.get("status", "pending"),
                    "created_at": str(c.get("created_at")),
                }
            )

        return jsonify(result), 200

    except Exception as e:
        print("ADMIN CHARITIES ERROR >>>", e)
        return jsonify({"error": "Server error"}), 500


# \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
@app.route("/charity/dashboard/<login_id>", methods=["GET"])
def charity_dashboard(login_id):
    try:
        from bson import ObjectId

        total = mongo.db.tbl_donations.count_documents({
            "charity_login_id": ObjectId(login_id)
        })

        pending = mongo.db.tbl_donations.count_documents({
            "charity_login_id": ObjectId(login_id),
            "status": {"$ne": "collected"}
        })

        collected = mongo.db.tbl_donations.count_documents({
            "charity_login_id": ObjectId(login_id),
            "status": "collected"
        })

        return jsonify({
            "total": total,
            "pending": pending,
            "collected": collected
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/jobprovider/job/<job_id>", methods=["GET"])
def get_single_job(job_id):
    try:
        job = mongo.find_one("tbl_jobs", {"_id": ObjectId(job_id)})

        if not job:
            return jsonify({"error": "Job not found"}), 404

        job["_id"] = str(job["_id"])
        job["login_id"] = str(job["login_id"])
        job["postDate"] = job["postDate"].strftime("%Y-%m-%d")
        job["lastDate"] = job["lastDate"].strftime("%Y-%m-%d")

        return jsonify(job), 200

    except Exception as e:
        print("❌ GET JOB ERROR:", e)
        return jsonify({"error": "Invalid job id"}), 400


# \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


# //////////////////////////////////////////////////////////////////////////


@app.route("/jobprovider/job/<job_id>", methods=["PUT"])
def update_job(job_id):
    try:
        data = request.json or {}

        required_fields = [
            "title",
            "description",
            "jobType",
            "skills",
            "lastDate",
            "status",
        ]

        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({"error": f"{field} is required"}), 400

        today = datetime.utcnow().date()
        last_date = datetime.fromisoformat(data["lastDate"]).date()

        if last_date <= today:
            return jsonify({"error": "Last date must be after today"}), 400

        update_data = {
            "title": data["title"],
            "description": data["description"],
            "jobType": data["jobType"],
            "skills": data["skills"],
            "salary": data.get("salary", ""),
            "lastDate": datetime.combine(last_date, datetime.min.time()),
            "status": data["status"],
            "updated_at": datetime.utcnow(),
        }

        result = mongo.db.tbl_jobs.update_one(
            {"_id": ObjectId(job_id)}, {"$set": update_data}
        )

        if result.matched_count == 0:
            return jsonify({"error": "Job not found"}), 404

        return jsonify({"message": "Job updated successfully"}), 200

    except Exception as e:
        print("❌ UPDATE JOB ERROR:", e)
        return jsonify({"error": "Failed to update job"}), 500


# \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


@app.route("/jobprovider/delete-job/<job_id>", methods=["DELETE"])
def delete_job(job_id):
    try:
        # Access collection directly from mongo.db
        result = mongo.db.tbl_jobs.delete_one({"_id": ObjectId(job_id)})

        if result.deleted_count == 0:
            return jsonify({"error": "Job not found"}), 404

        return jsonify({"message": "Job deleted permanently"}), 200

    except Exception as e:
        print("❌ Delete job error:", e)
        return jsonify({"error": str(e)}), 500


# \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


@app.route("/charity/delete-donation/<donation_id>", methods=["DELETE"])
def delete_donation(donation_id):
    try:
        result = mongo.db.tbl_donations.delete_one({"_id": ObjectId(donation_id)})

        if result.deleted_count == 0:
            return jsonify({"error": "Donation not found"}), 404

        return jsonify({"message": "Donation deleted successfully"}), 200

    except Exception as e:
        print("DELETE DONATION ERROR:", e)
        return jsonify({"error": "Failed to delete donation"}), 500


# /////////////////////////////////////////////////////////////////////////////


@app.route("/charity/update-donation/<donation_id>", methods=["PUT"])
def update_donation(donation_id):
    try:
        data = request.json or {}

        pickup_address = data.get("pickup_address", "")
        drop_center = data.get("drop_center", "")

        # Handle delivery mode logic
        if data.get("delivery_mode") == "pickup":
            drop_center = ""
        else:
            pickup_address = ""

        update_data = {
            "items": data.get("items"),
            "delivery_mode": data.get("delivery_mode"),
            "pickup_address": pickup_address,
            "drop_center": drop_center,
            "updated_at": datetime.utcnow(),
        }

        result = mongo.db.tbl_donations.update_one(
            {"_id": ObjectId(donation_id)}, {"$set": update_data}
        )

        if result.matched_count == 0:
            return jsonify({"error": "Donation not found"}), 404

        return jsonify({"message": "Donation updated successfully"}), 200

    except Exception as e:
        print("UPDATE DONATION ERROR:", e)
        return jsonify({"error": "Failed to update donation"}), 500


# \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
@app.route("/charity/get-donation/<donation_id>", methods=["GET"])
def get_single_donation(donation_id):
    try:
        donation = mongo.db.tbl_donations.find_one({"_id": ObjectId(donation_id)})

        if not donation:
            return jsonify({"message": "Donation not found"}), 404

        result = {
            "id": str(donation["_id"]),
            "items": donation.get("items", []),
            "delivery_mode": donation.get("delivery_mode", ""),
            "pickup_address": donation.get("pickup_address", ""),
            "drop_center": donation.get("drop_center", ""),
            "status": donation.get("status", ""),
            "created_at": str(donation.get("created_at")),
        }

        return jsonify(result), 200

    except Exception as e:
        print("GET DONATION ERROR:", e)
        return jsonify({"error": "Failed to fetch donation"}), 500


# \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


# ADMIN → CREATE SOCIAL WORKER
@app.route("/admin/create-socialworker", methods=["POST"])
def create_socialworker():
    try:
        data = request.json or {}
        required_fields = ["name", "email", "password"]

        # Check required fields
        if not all(field in data and data[field] for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400

        # Check if email already exists
        existing = mongo.find_one("tbl_login", {"email": data["email"]})
        if existing:
            return jsonify({"error": "Social worker already exists"}), 400

        # Insert into login table
        login_data = {
            "username": data["name"],  # can also be the email
            "email": data["email"],
            "password": data["password"],  # plain text for now; can hash later
            "usertype": "socialworker",
            "status": "Approved",  # no need to wait for approval
        }

        login_id = mongo.insert_one("tbl_login", login_data)

        return (
            jsonify(
                {
                    "message": "Social worker created successfully",
                    "login_id": str(login_id),
                    "email": data["email"],
                    "password": data["password"],
                }
            ),
            201,
        )

    except Exception as e:
        print("CREATE SOCIAL WORKER ERROR:", e)
        return jsonify({"error": "Failed to create social worker"}), 500


# \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


@app.route("/socialworker/verify-mom/<mom_id>", methods=["PUT"])
def verify_mom(mom_id):
    try:
        result = mongo.db.tbl_user.update_one(
            {"_id": ObjectId(mom_id)}, {"$set": {"verification_status": "Verified"}}
        )

        if result.matched_count == 0:
            return jsonify({"error": "Mom not found"}), 404

        mom = mongo.db.tbl_user.find_one({"_id": ObjectId(mom_id)})
        worker_id = mom.get("verified_by")
        if worker_id:
            create_notification(
                worker_id,
                "socialworker",
                "verify_mom",
                f"You have successfully verified Mom (ID: {mom_id})",
                mongo,
            )

        return jsonify({"message": "Mom verified successfully"}), 200

    except Exception as e:
        print("VERIFY MOM ERROR:", e)
        return jsonify({"error": "Failed to verify mom"}), 500


# \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


@app.route("/social-worker/update-status/<donation_id>", methods=["PUT"])
def update_status(donation_id):
    try:
        data = request.json
        new_status = data.get("status")

        allowed_status = ["approved", "rejected", "collected", "completed"]

        if new_status not in allowed_status:
            return jsonify({"error": "Invalid status"}), 400

        mongo.db.tbl_donations.update_one(
            {"_id": ObjectId(donation_id)}, {"$set": {"status": new_status}}
        )

        return jsonify({"message": "Status updated successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/socialworker/pending-moms", methods=["GET"])
def get_pending_moms():
    try:
        moms = list(mongo.db.tbl_user.find({"verification_status": "pending"}))

        for m in moms:
            m["_id"] = str(m["_id"])
            m["login_id"] = str(m.get("login_id"))

        return jsonify(moms), 200

    except Exception as e:
        print("PENDING MOMS ERROR:", e)
        return jsonify({"error": "Failed to fetch moms"}), 500


# ////////////////////////////////////////////////////////
# SOCIAL WORKER → VIEW ALL DONATIONS
# ////////////////////////////////////////////////////////


@app.route("/social-worker/donations", methods=["GET"])
def socialworker_get_donations():
    try:
        donations = mongo.db.tbl_donations.find().sort("created_at", -1)

        result = []

        for d in donations:
            login_id = d.get("charity_login_id")

            # Get email from tbl_login
            login_data = mongo.db.tbl_login.find_one({"_id": ObjectId(login_id)})
            # Get organization name from tbl_charityprovider
            charity_data = mongo.db.tbl_charityprovider.find_one(
                {"login_id": ObjectId(login_id)}
            )

            result.append(
                {
                    "id": str(d["_id"]),
                    "charity_name": (
                        charity_data.get("organization_name") if charity_data else "N/A"
                    ),
                    "charity_email": login_data.get("email") if login_data else "N/A",
                    "items": d.get("items", []),
                    "delivery_mode": d.get("delivery_mode", ""),
                    "pickup_address": d.get("pickup_address", ""),
                    "drop_center": d.get("drop_center", ""),
                    "status": d.get("status", "pending"),
                    "created_at": str(d.get("created_at")),
                }
            )

        return jsonify(result), 200

    except Exception as e:
        print("SOCIAL WORKER DONATION FETCH ERROR:", e)
        return jsonify({"error": "Failed to fetch donations"}), 500


# ////////////////////////////////////////////////////////
# ADMIN → DONATION SUMMARY
# ////////////////////////////////////////////////////////
@app.route("/admin/dashboard", methods=["GET"])
def admin_dashboard():
    try:
        # 🔹 CHARITY (Mom Requests)
        total_requests = mongo.db.tbl_mom_requests.count_documents({})
        pending = mongo.db.tbl_mom_requests.count_documents({"status": "pending"})
        assigned = mongo.db.tbl_mom_requests.count_documents({"status": "assigned"})
        completed = mongo.db.tbl_mom_requests.count_documents({"status": "completed"})

        # 🔹 SPONSORSHIP
        total_sponsorships = mongo.db.tbl_sponsorship_requests.count_documents({})

        sponsorship_pending = mongo.db.tbl_sponsorship_requests.count_documents(
            {"status": "pending"}
        )

        sponsorship_accepted = mongo.db.tbl_sponsorship_requests.count_documents(
            {"status": "accepted"}
        )

        sponsorship_sponsored = mongo.db.tbl_sponsorship_requests.count_documents(
            {"status": "sponsored"}
        )

        sponsorship_completed = mongo.db.tbl_sponsorship_requests.count_documents(
            {"status": "completed"}
        )
        sponsorship_rejected = mongo.db.tbl_sponsorship_requests.count_documents(
            {"status": "rejected"}
        )

        # 🔹 DONATIONS
        total_donations = mongo.db.tbl_donations.count_documents(
            {"status": "collected"}
        )

        # 🔹 INVENTORY
        inventory = mongo.db.tbl_inventory.find_one({"_id": "main_inventory"}) or {}

        return jsonify(
            {
                # Charity
                "total_requests": total_requests,
                "pending": pending,
                "assigned": assigned,
                "completed": completed,
                # Sponsorship ✅ NEW
                "total_sponsorships": total_sponsorships,
                "sponsorship_pending": sponsorship_pending,
                "sponsorship_accepted": sponsorship_accepted,
                "sponsorship_sponsored": sponsorship_sponsored,
                "sponsorship_completed": sponsorship_completed,
                "sponsorship_rejected": sponsorship_rejected,
                # Others
                "total_donations": total_donations,
                "inventory": inventory,
                "workers": [],
            }
        )

    except Exception as e:
        print("DASHBOARD ERROR:", e)
        return jsonify({})
    # ///////////////////////////////////////////////////////////////////


@app.route("/admin/donation-summary", methods=["GET"])
def admin_donation_summary():
    try:
        donations = mongo.db.tbl_donations.find()

        total_donations = 0
        item_summary = {}

        for d in donations:
            total_donations += 1

            for item in d.get("items", []):
                name = item.get("item")
                qty = int(item.get("quantity", 0))

                if name in item_summary:
                    item_summary[name] += qty
                else:
                    item_summary[name] = qty

        return (
            jsonify({"total_donations": total_donations, "item_summary": item_summary}),
            200,
        )

    except Exception as e:
        print("SUMMARY ERROR:", e)
        return jsonify({"error": "Failed to fetch summary"}), 500


# ////////////////////////////////////////////////////////
# MOM → APPLY FOR DONATION
# ////////////////////////////////////////////////////////
@app.route("/mom/apply-donation", methods=["POST"])
def mom_apply_donation():
    try:
        data = request.json or {}

        login_id = data.get("login_id")
        items = data.get("items")

        if not login_id or not items:
            return jsonify({"error": "Invalid request"}), 400

        # 1️⃣ Insert mom request
        request_data = {
            "mom_login_id": ObjectId(login_id),
            "items": items,
            "status": "pending",
            "created_at": datetime.utcnow(),
        }

        request_id = mongo.insert_one("tbl_mom_requests", request_data)

        # 2️⃣ 🔔 Create notification for admin
        mongo.db.tbl_notifications.insert_one(
            {
                "user_type": "admin",  # visible to all admins
                "type": "mom_request",
                "message": f"New charity request submitted by mom (Request ID: {request_id})",
                "completed": False,  # for common notifications
                "created_at": datetime.utcnow(),
            }
        )

        return jsonify({"message": "Donation request submitted"}), 201

    except Exception as e:
        print("MOM REQUEST ERROR:", e)
        return jsonify({"error": "Failed to apply donation"}), 500


# ////////////////////////////////////////////////////////
# ADMIN → VIEW MOM REQUESTS
# ////////////////////////////////////////////////////////
@app.route("/admin/mom-requests", methods=["GET"])
def get_mom_requests():
    try:
        requests = mongo.db.tbl_mom_requests.find()
        result = []

        for r in requests:
            worker_name = None
            mom_name = None
            mom_contact = None
            mom_address = None

            # ✅ Get worker name
            if r.get("social_worker_id"):
                worker = mongo.db.tbl_login.find_one(
                    {"_id": ObjectId(r["social_worker_id"])}
                )
                if worker:
                    worker_name = worker.get("username")

            # ✅ Get MOM details
            if r.get("mom_login_id"):
                mom_user = mongo.db.tbl_user.find_one(
                    {"login_id": ObjectId(r["mom_login_id"])}
                )

                if mom_user:
                    mom_name = mom_user.get("name")
                    mom_contact = mom_user.get("contact")
                    mom_address = mom_user.get("address")

            result.append({
                "request_id": str(r["_id"]),
                "items": r.get("items"),
                "status": r.get("status"),
                "created_at": r.get("created_at"),

                # ✅ NEW FIELDS
                "mom_name": mom_name,
                "mom_contact": mom_contact,
                "mom_address": mom_address,

                "worker_name": worker_name,
                "worker_id": (
                    str(r.get("social_worker_id"))
                    if r.get("social_worker_id")
                    else None
                ),
                "delivered_at": r.get("delivered_at"),
            })

        return jsonify(result)

    except Exception as e:
        print("GET MOM REQUEST ERROR:", e)
        return jsonify([])
# ////////////////////////////////////////////////////////
# ADMIN → UPDATE MOM REQUEST STATUS
# ////////////////////////////////////////////////////////


@app.route("/admin/update-mom-request/<request_id>", methods=["PUT"])
def admin_update_mom_request(request_id):
    try:
        data = request.json or {}
        status = data.get("status")

        if status not in ["approved", "rejected"]:
            return jsonify({"error": "Invalid status"}), 400

        mongo.update_one(
            "tbl_mom_requests", {"_id": ObjectId(request_id)}, {"status": status}
        )

        return jsonify({"message": "Request updated"}), 200

    except Exception as e:
        print("ADMIN UPDATE MOM REQUEST ERROR:", e)
        return jsonify({"error": "Failed to update"}), 500


# ////////////////////////////////////////////////////////


@app.route("/mom/my-requests", methods=["POST"])
def get_my_requests():
    try:
        data = request.json or {}
        login_id = data.get("login_id")

        print("LOGIN ID:", login_id)

        if not login_id:
            return jsonify([])

        try:
            object_id = ObjectId(login_id)
        except InvalidId:
            return jsonify([])

        requests = list(mongo.db.tbl_mom_requests.find({"mom_login_id": object_id}))

        result = []

        for r in requests:
            status = r.get("status")

            # 🔥 CONVERT FOR MOM VIEW
            if status == "assigned":
                status = "accepted"

            # ✅ MUST BE INSIDE LOOP
            result.append(
                {
                    "_id": str(r["_id"]),
                    "mom_login_id": str(r["mom_login_id"]),
                    "items": r.get("items", []),
                    "status": status,
                    "created_at": r.get("created_at"),
                }
            )

        return jsonify(result), 200

    except Exception as e:
        print("MY REQUEST ERROR:", e)
        return jsonify([]), 500


# ///////////////////////////////////////////////////////////////////////////////
@app.route("/mom/add-child", methods=["POST"])
def add_child():
    mom_login_id = request.form.get("mom_login_id")
    print("LOGIN ID RECEIVED:", mom_login_id)

    if not mom_login_id:
        return jsonify({"error": "mom_login_id missing"}), 400

    name = request.form.get("name")
    age = request.form.get("age")
    gender = request.form.get("gender")
    is_school_going = request.form.get("is_school_going")
    school_name = request.form.get("school_name")
    child_class = request.form.get("class")

    birth_certificate = request.files.get("birth_certificate")

    file_path = None
    if birth_certificate:
        filename = secure_filename(birth_certificate.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        birth_certificate.save(file_path)

    child_data = {
        "mom_login_id": ObjectId(mom_login_id),  # ✅ ONLY conversion here
        "name": name,
        "age": int(age),
        "gender": gender,
        "is_school_going": is_school_going == "true",
        "school_name": school_name,
        "class": child_class,
        "birth_certificate_path": file_path,
        "created_at": datetime.utcnow(),
    }

    mongo.db.tbl_children.insert_one(child_data)

    return jsonify({"message": "Child added successfully"}), 201


# \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


@app.route("/mom/view-jobs", methods=["GET"])
def view_jobs():
    try:
        jobs = list(mongo.db.tbl_jobs.find({"status": "accepted"}))

        job_list = []

        for job in jobs:
            provider = mongo.db.tbl_jobprovider.find_one({"login_id": job["login_id"]})

            job_list.append(
                {
                    "job_id": str(job["_id"]),
                    "title": job.get("title"),
                    "description": job.get("description"),
                    "salary": job.get("salary"),
                    "created_at": job.get("created_at"),
                    "provider_name": provider.get("company_name") if provider else "",
                    "location": provider.get("address") if provider else "",
                }
            )

        return jsonify(job_list), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# //////////////////////////////////////////////////////////////////////////////////////////////
@app.route("/mom/apply-job", methods=["POST"])
def apply_job():
    try:
        job_id = request.form.get("job_id")
        mom_login_id = request.form.get("mom_login_id")
        cover_letter = request.form.get("cover_letter")
        resume = request.files.get("resume")

        if not job_id or not mom_login_id or not resume:
            return jsonify({"error": "Missing required fields"}), 400

        # Ensure resume folder exists
        resume_folder = os.path.join(app.config["UPLOAD_FOLDER"], "resumes")
        os.makedirs(resume_folder, exist_ok=True)

        filename = secure_filename(resume.filename)
        save_path = os.path.join(resume_folder, filename)
        resume.save(save_path)

        application_data = {
            "job_id": ObjectId(job_id),
            "mom_login_id": ObjectId(mom_login_id),
            "resume": filename,  # ✅ store only filename
            "cover_letter": cover_letter,
            "status": "pending",
            "applied_at": datetime.utcnow(),
        }

        mongo.db.tbl_job_applications.insert_one(application_data)

        return jsonify({"message": "Applied successfully"}), 201

    except Exception as e:
        print("APPLY JOB ERROR:", e)
        return jsonify({"error": str(e)}), 500


# ////////////////////////////////////////////////////////////////////////////////////////////
@app.route("/mom/my-applications", methods=["POST"])
def my_applications():
    try:
        data = request.get_json()
        mom_login_id = data.get("mom_login_id")

        if not ObjectId.is_valid(mom_login_id):
            return jsonify({"error": "Invalid mom login id"}), 400

        applications = list(
            mongo.db.tbl_job_applications.find({"mom_login_id": ObjectId(mom_login_id)})
        )

        result = []

        for app in applications:
            job = mongo.db.tbl_jobs.find_one({"_id": app["job_id"]})

            if job:
                result.append(
                    {
                        "application_id": str(app["_id"]),
                        "job_id": str(job["_id"]),
                        "title": job.get("title"),
                        "description": job.get("description"),
                        "salary": job.get("salary"),
                        "status": app.get("status"),
                        "applied_at": app.get("applied_at"),
                    }
                )

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ///////////////////////////////////////////////////////////////////////////////////
@app.route("/jobprovider/job-applications", methods=["POST"])
def job_applications():
    try:
        data = request.get_json()
        jobprovider_login_id = data.get("jobprovider_login_id")

        if not ObjectId.is_valid(jobprovider_login_id):
            return jsonify({"error": "Invalid login id"}), 400

        jobs = list(
            mongo.db.tbl_jobs.find({"login_id": ObjectId(jobprovider_login_id)})
        )
        job_ids = [job["_id"] for job in jobs]

        applications = list(
            mongo.db.tbl_job_applications.find({"job_id": {"$in": job_ids}})
        )

        result = []

        for app_data in applications:
            job = mongo.db.tbl_jobs.find_one({"_id": app_data["job_id"]})

            mom = mongo.db.tbl_user.find_one({"login_id": app_data["mom_login_id"]})

            # 🔥 Get login info for email
            mom_login = mongo.db.tbl_login.find_one({"_id": app_data["mom_login_id"]})

            result.append(
                {
                    "application_id": str(app_data["_id"]),
                    "job_title": job.get("title") if job else "Unknown",
                    "status": app_data.get("status", "pending"),
                    "applied_at": app_data.get("applied_at"),
                    # Mom Details
                    "mom_name": mom.get("name") if mom else "Unknown",
                    "mom_email": mom_login.get("email") if mom_login else "",
                    "mom_phone": mom.get("contact") if mom else "",
                    # Application Details
                    "cover_letter": app_data.get("cover_letter", ""),
                    "resume": app_data.get("resume", ""),  # ✅ correct field
                }
            )

        return jsonify(result), 200

    except Exception as e:
        print("JOB APPLICATION ERROR:", e)
        return jsonify({"error": str(e)}), 500


# ///////////////////////////////////////////////////////////////////////////
@app.route("/jobprovider/update-application-status", methods=["POST"])
def update_application_status():
    try:
        data = request.get_json()
        application_id = data.get("application_id")
        status = data.get("status")

        if not ObjectId.is_valid(application_id):
            return jsonify({"error": "Invalid application id"}), 400

        mongo.db.tbl_job_applications.update_one(
            {"_id": ObjectId(application_id)}, {"$set": {"status": status}}
        )

        return jsonify({"message": "Status updated"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/uploads/resumes/<filename>")
def uploaded_file(filename):
    return send_from_directory(
        os.path.join(app.config["UPLOAD_FOLDER"], "resumes"), filename
    )


# /////////////////////////////////////////////////////////////////////////
@app.route("/jobprovider/job/<job_id>/applications", methods=["GET"])
def get_applications_for_job(job_id):
    try:
        applications = list(
            mongo.db.tbl_job_applications.find({"job_id": ObjectId(job_id)})
        )

        result = []

        for app_data in applications:
            mom = mongo.db.tbl_user.find_one(
                {"login_id": ObjectId(app_data["mom_login_id"])}
            )

            result.append(
                {
                    "application_id": str(app_data["_id"]),
                    "mom_name": mom.get("name") if mom else "Unknown",
                    "email": mom.get("email") if mom else "",
                    "contact": mom.get("contact") if mom else "",
                    "cover_letter": app_data.get("cover_letter", ""),
                    "resume": app_data.get("resume", ""),
                }
            )

        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
@app.route("/social-work/update-sponsorship-status", methods=["POST"])
def update_sponsorship_status():
    request_id = request.form.get("request_id")
    social_worker_id = request.form.get("social_worker_id")
    status = request.form.get("status")  # approved / rejected

    if not request_id or not social_worker_id or not status:
        return jsonify({"error": "Missing required fields"}), 400

    if status not in ["approved", "rejected"]:
        return jsonify({"error": "Invalid status"}), 400

    update_result = mongo.db.tbl_sponsorship_requests.update_one(
        {"_id": ObjectId(request_id)},
        {
            "$set": {
                "status": status,
                "approved_by": ObjectId(social_worker_id),
                "updated_at": datetime.utcnow(),
            }
        },
    )

    if update_result.modified_count == 0:
        return jsonify({"error": "Request not found"}), 404

    return jsonify({"message": f"Sponsorship request {status} successfully"}), 200


# \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


@app.route("/charity/sponsor-child", methods=["POST"])
def sponsor_child():

    try:
        request_id = request.form.get("request_id")
        sponsor_id = request.form.get("sponsor_id")

        print("REQUEST ID:", request_id)
        print("SPONSOR ID:", sponsor_id)

        if not request_id or not sponsor_id:
            return jsonify({"error": "Missing required fields"}), 400

        # check if request exists
        sponsorship_request = mongo.db.tbl_sponsorship_requests.find_one(
            {"_id": ObjectId(request_id)}
        )

        if not sponsorship_request:
            return jsonify({"error": "Request not found"}), 404

        print("CURRENT STATUS:", sponsorship_request["status"])

        # check if approved
        if sponsorship_request["status"] != "approved":
            return jsonify({"error": "Request is not approved"}), 400

        # update to sponsored
        mongo.db.tbl_sponsorship_requests.update_one(
            {"_id": ObjectId(request_id)},
            {
                "$set": {
                    "status": "sponsored",
                    "sponsor_id": ObjectId(sponsor_id),
                    "sponsored_at": datetime.utcnow(),
                }
            },
        )

        return jsonify({"message": "Child sponsored successfully"}), 200

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": "Server error"}), 500


# ///////////////////////////////////////////////////////////////////////////////
@app.route("/mom/request-sponsorship", methods=["POST"])
def request_sponsorship():
    try:
        
        child_id = request.form.get("child_id")
        amount = request.form.get("amount")
        purpose = request.form.get("purpose")
        reason = request.form.get("reason")
        support_type = request.form.get("type")
        login_id = request.form.get("login_id")

        if not child_id or not amount or not purpose or not reason or not support_type:
            return jsonify({"error": "All fields are required"}), 400

        ALLOWED_TYPES = ["education", "medical", "food", "clothing", "other"]
        if support_type.lower() not in ALLOWED_TYPES:
            return jsonify({"error": "Invalid support type"}), 400

        # ✅ Check existing
        existing = mongo.db.tbl_sponsorship_requests.find_one(
            {"child_id": ObjectId(child_id), "status": {"$in": ["pending", "approved"]}}
        )
        if existing:
            return jsonify({"error": "A sponsorship request already exists"}), 400

        # ✅ Insert sponsorship
        sponsorship_data = {
            "child_id": ObjectId(child_id),
            "mom_login_id": ObjectId(login_id), 
            "amount": float(amount),
            "purpose": purpose,
            "reason": reason,
            "type": support_type.lower(),
            "status": "pending",
            "created_at": datetime.utcnow(),
        }

        mongo.db.tbl_sponsorship_requests.insert_one(sponsorship_data)

        # 🔔 SINGLE NOTIFICATION (NO LOOP)
        mongo.db.tbl_notifications.insert_one(
            {
                "user_type": "socialworker",
                "type": "new_sponsorship_request",
                "message": f"New sponsorship request for child ID: {child_id}",
                "completed": False,
                "created_at": datetime.utcnow(),
            }
        )

        return jsonify({"message": "Sponsorship request submitted successfully"}), 201

    except Exception as e:
        print("SPONSORSHIP ERROR:", e)
        return jsonify({"error": "Failed to submit request"}), 500


@app.route("/mom/child-sponsorship/<child_id>", methods=["GET"])
def get_child_sponsorship(child_id):
    try:
        # Fetch all requests for this child
        sponsorship_cursor = mongo.db.tbl_sponsorship_requests.find(
            {"child_id": ObjectId(child_id)}
        ).sort("created_at", -1)

        sponsorships = []
        for s in sponsorship_cursor:
            s["_id"] = str(s["_id"])
            s["child_id"] = str(s["child_id"])

            # Make sure all fields exist
            sponsorships.append(
                {
                    "_id": s["_id"],
                    "child_id": s["child_id"],
                    "amount": s.get("amount", 0),
                    "purpose": s.get("purpose", ""),
                    "type": s.get("type", ""),
                    "status": s.get("status", "pending"),
                    "reason": s.get("reason", ""),
                    "created_at": s.get("created_at"),
                }
            )

        return jsonify(sponsorships), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ////////////////////////////////////////////////////////////////////////////////
@app.route("/mom/get-children", methods=["POST"])
def get_children():
    mom_login_id = (
        request.json.get("login_id")
        if request.is_json
        else request.form.get("login_id")
    )
    print("LOGIN ID RECEIVED:", mom_login_id)

    if not mom_login_id:
        return jsonify({"error": "login_id missing"}), 400

    try:
        mom = mongo.db.tbl_user.find_one({"login_id": ObjectId(mom_login_id)})
        if not mom:
            return jsonify({"error": "Mom not found"}), 404

        print("MOM FOUND:", mom)

        # ✅ Use ObjectId here
        children = list(
            mongo.db.tbl_children.find(
                {"mom_login_id": ObjectId(mom_login_id)}  # keep as ObjectId
            )
        )

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": "invalid id"}), 400

    print("FOUND CHILDREN:", children)

    for c in children:
        c["_id"] = str(c["_id"])
        c["mom_login_id"] = str(
            c["mom_login_id"]
        )  # convert ObjectId to string for frontend

    return jsonify(children), 200


# @app.route("/mom/child-sponsorship/<child_id>", methods=["GET"])
# def child_sponsorship(child_id):
#     print("CHILD ID RECEIVED:", child_id)
#     requests = list(
#         mongo.db.tbl_sponsorship_requests.find({"child_id": ObjectId(child_id)}).sort(
#             "created_at", -1
#         )
#     )

#     print("REQUESTS FOUND:", requests)
#     for r in requests:
#         r["_id"] = str(r["_id"])
#         r["child_id"] = str(r["child_id"])

#     return jsonify(requests if requests else [])


# //////////////////////////////////////////////////////////////////
@app.route("/mom/profile", methods=["POST"])
def get_mom_profile():
    try:
        data = request.get_json()
        mom_login_id = data.get("mom_login_id")

        if not mom_login_id or not ObjectId.is_valid(mom_login_id):
            return jsonify({"error": "Invalid mom login id"}), 400

        mom = mongo.db.tbl_user.find_one({"login_id": ObjectId(mom_login_id)})
        login = mongo.db.tbl_login.find_one({"_id": ObjectId(mom_login_id)})

        if not mom or not login:
            return jsonify({"error": "Mom not found"}), 404

        profile = {
            "name": mom.get("name", ""),
            "contact": mom.get("contact", ""),
            "address": mom.get("address", ""),
            "aadhar": mom.get("aadhar", ""),
            "email": login.get("email", ""),
        }

        return jsonify(profile), 200

    except Exception as e:
        print("GET MOM PROFILE ERROR:", e)
        return jsonify({"error": str(e)}), 500


# ////////////////////////////////////////////////////////////////////////////////
@app.route("/mom/profile/update", methods=["POST"])
def update_mom_profile():
    try:
        data = request.get_json()
        mom_login_id = data.get("mom_login_id")

        if not mom_login_id or not ObjectId.is_valid(mom_login_id):
            return jsonify({"error": "Invalid mom login id"}), 400

        update_data = {}

        if "name" in data:
            update_data["name"] = data["name"]

        if "contact" in data:
            update_data["contact"] = data["contact"]

        if "address" in data:
            update_data["address"] = data["address"]

        if not update_data:
            return jsonify({"error": "No fields to update"}), 400

        result = mongo.db.tbl_user.update_one(
            {"login_id": ObjectId(mom_login_id)}, {"$set": update_data}
        )

        if result.matched_count == 0:
            return jsonify({"error": "User not found"}), 404

        return jsonify({"message": "Profile updated successfully"}), 200

    except Exception as e:
        print("UPDATE MOM PROFILE ERROR:", e)
        return jsonify({"error": str(e)}), 500


# /////////////////////////////////////////////////////////////////////////////
@app.route("/mom/change-password-mom", methods=["POST"])
def change_password_mom():
    try:
        data = request.get_json()

        mom_login_id = data.get("mom_login_id")
        current_password = data.get("current_password")
        new_password = data.get("new_password")

        if not mom_login_id or not current_password or not new_password:
            return jsonify({"error": "Missing fields"}), 400

        # Find login record
        user = mongo.db.tbl_login.find_one({"_id": ObjectId(mom_login_id)})

        if not user:
            return jsonify({"error": "User not found"}), 404

        # Check current password
        if user.get("password") != current_password:
            return jsonify({"error": "Current password incorrect"}), 401

        # Update password
        mongo.db.tbl_login.update_one(
            {"_id": ObjectId(mom_login_id)}, {"$set": {"password": new_password}}
        )

        return jsonify({"message": "Password updated successfully"}), 200

    except Exception as e:
        print("CHANGE PASSWORD ERROR:", e)
        return jsonify({"error": str(e)}), 500
    # ////////////////////////////////////////////////////////////////


# //////////////////////////////////////////////////////////////////////
@app.route("/admin/approve-sponsorship", methods=["POST"])
def approve_sponsorship():

    data = request.json
    request_id = data.get("request_id")

    if not request_id:
        return jsonify({"error": "Request ID missing"}), 400

    result = mongo.db.tbl_sponsorship_requests.update_one(
        {"_id": ObjectId(request_id), "status": "verified"},
        {"$set": {"status": "approved", "approved_at": datetime.utcnow()}},
    )

    if result.modified_count == 0:
        return jsonify({"error": "Request not found or already processed"}), 400

    return jsonify({"message": "Sponsorship request approved"}), 200


# ////////////////////////////////////////////////////////////////
@app.route("/admin/reject-sponsorship", methods=["POST"])
def reject_sponsorship():

    data = request.json
    request_id = data.get("request_id")

    if not request_id:
        return jsonify({"error": "Request ID missing"}), 400

    result = mongo.db.tbl_sponsorship_requests.update_one(
        {"_id": ObjectId(request_id), "status": "verified"},
        {"$set": {"status": "rejected", "rejected_at": datetime.utcnow()}},
    )

    if result.modified_count == 0:
        return jsonify({"error": "Request not found or already processed"}), 400

    return jsonify({"message": "Sponsorship rejected"}), 200


# //////////////////////////////////////////////////////////////////
@app.route("/admin/view-sponsorship-requests", methods=["GET"])
def view_sponsorship_requests():
    try:
        requests = list(
           (mongo.db.tbl_sponsorship_requests.find())
        )

        result = []

        for req in requests:
            child = mongo.db.tbl_children.find_one(
                {"_id": ObjectId(req["child_id"])}
            )

            child_name = None
            mom_name = None

            if child:
                child_name = child.get("name")

                mom = mongo.db.tbl_user.find_one(
                    {"login_id": child.get("mom_login_id")}
                )

                if mom:
                    mom_name = mom.get("name")

            result.append(
                {
                    "_id": str(req["_id"]),
                    "child_name": child_name,
                    "mom_name": mom_name,
                    "amount": req["amount"],
                    "purpose": req["purpose"],
                    "reason": req["reason"],
                    "type": req["type"],
                    "status": req["status"],
                    "created_at": req["created_at"],
                }
            )

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)})
# //////////////////////////////////////////////////////////////
@app.route("/charity/view-approved-sponsorships", methods=["GET"])
def view_approved_sponsorships():

    requests = []

    data = mongo.db.tbl_sponsorship_requests.find({"status": "approved"})

    for r in data:
        child = mongo.db.tbl_children.find_one({"_id": ObjectId(r["child_id"])})

        requests.append(
            {
                "_id": str(r["_id"]),
                "child_id": str(r["child_id"]),
                "child_name": child["name"] if child else "N/A",  # ✅ FIX
                "amount": r["amount"],
                "purpose": r["purpose"],
                "reason": r["reason"],
                "type": r["type"],
                "status": r["status"],
            }
        )

    return jsonify(requests)


# ////////////////////////////////////////////////////////////////
@app.route("/socialworker/sponsored-children", methods=["GET"])
def get_sponsored_children():
    try:
        sponsorships = list(
            mongo.db.tbl_sponsorship_requests.find({"status": "sponsored"})
        )

        cleaned = []

        for s in sponsorships:
            print("\n🔵 FULL SPONSORSHIP DOC >>>", s)

            temp = dict(s)

            # 🔹 Convert ObjectIds to string
            for key in temp:
                if isinstance(temp[key], ObjectId):
                    temp[key] = str(temp[key])

            # 🔹 CHILD DETAILS
            child = mongo.db.tbl_children.find_one(
                {"_id": ObjectId(s["child_id"])}
            )
            print("🟢 CHILD DATA >>>", child)

            temp["child_name"] = child["name"] if child else "Unknown"

            # 🔹 MOM DETAILS
            mom = None
            login = None
            mom_login_id = s.get("mom_login_id")

            print("🟡 MOM LOGIN ID >>>", mom_login_id)

            if mom_login_id:
                try:
                    # Step 1: Fetch login
                    login = mongo.db.tbl_login.find_one(
                        {"_id": ObjectId(mom_login_id)}
                    )

                    # Step 2: Fetch user using login_id
                    mom = mongo.db.tbl_user.find_one(
                        {"login_id": ObjectId(mom_login_id)}
                    )

                except Exception as e:
                    print("❌ MOM FETCH ERROR:", e)

            print("🟢 LOGIN DATA >>>", login)
            print("🟢 MOM DATA >>>", mom)

            # 🔹 Assign values safely
            temp["mom_name"] = mom.get("name") if mom else "N/A"
            temp["mom_phone"] = mom.get("contact") if mom else "N/A"
            temp["mom_address"] = mom.get("address") if mom else "N/A"
            temp["mom_email"] = login.get("email") if login else "N/A"

            cleaned.append(temp)

        return jsonify(cleaned), 200

    except Exception as e:
        print("🔥 ERROR fetching sponsored children:", e)
        return jsonify({"error": "Failed to fetch sponsored children"}), 500
# ////////////////////////////////////////////////////////////////////////
@app.route("/socialworker/complete-sponsorship/<sponsorship_id>", methods=["PATCH"])
def complete_sponsorship(sponsorship_id):
    try:
        result = mongo.db.tbl_sponsorship_requests.update_one(
            {"_id": ObjectId(sponsorship_id)}, {"$set": {"status": "completed"}}
        )

        if result.matched_count == 0:
            return jsonify({"error": "Sponsorship not found"}), 404

        return jsonify({"message": "Sponsorship marked as completed"}), 200

    except Exception as e:
        print("Error completing sponsorship:", e)
        return jsonify({"error": "Failed to complete sponsorship"}), 500


# //////////////////////////////////////////////////////////////////


@app.route("/charity/view-sponsored-children", methods=["GET"])
def view_sponsored_children():
    try:

        sponsorships = list(
            mongo.db.tbl_sponsorship_requests.find(
                {"status": {"$in": ["sponsored", "completed"]}}
            )
        )

        result = []

        for s in sponsorships:

            child = mongo.db.tbl_children.find_one({"_id": ObjectId(s["child_id"])})

            child_name = child.get("name") if child else "Unknown"

            result.append(
                {
                    "_id": str(s["_id"]),
                    "child_name": child_name,
                    "purpose": s.get("purpose"),
                    "amount": s.get("amount"),
                    "status": s.get("status"),
                    "sponsored_at": (
                        str(s.get("sponsored_at")) if s.get("sponsored_at") else None
                    ),
                }
            )

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# /////////////////////////////////////////////////////////////
@app.route("/admin/approve-job/<job_id>", methods=["PUT"])
def admin_approve_job(job_id):
    try:
        mongo.db.tbl_jobs.update_one(
            {"_id": oid(job_id)}, {"$set": {"status": "accepted"}}
        )

        return jsonify({"message": "Job approved successfully"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ////////////////////////////////////////////////////////////////


@app.route("/admin/pending-jobs", methods=["GET"])
def pending_jobs():
    try:
        jobs = list(mongo.db.tbl_jobs.find({"status": "pending"}))

        result = []

        for job in jobs:

            provider = mongo.db.tbl_jobprovider.find_one(
                {"login_id": job.get("login_id")}
            )

            result.append(
                {
                    "job_id": str(job["_id"]),
                    "title": job.get("title"),
                    "description": job.get("description"),
                    "salary": job.get("salary"),
                    "jobType": job.get("jobType"),
                    "company_name": provider["company_name"] if provider else "Unknown",
                }
            )

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)})


# ////////////////////////////////////////////////////////////
@app.route("/admin/reject-job/<job_id>", methods=["PUT"])
def admin_reject_job(job_id):
    try:
        mongo.db.tbl_jobs.update_one(
            {"_id": oid(job_id)}, {"$set": {"status": "rejected"}}
        )

        return jsonify({"message": "Job rejected successfully"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# /////////////////////////////////////////////////////////////////
@app.route("/socialworker/verify-sponsorship/<request_id>", methods=["PUT"])
def verify_sponsorship(request_id):
    try:
        mongo.db.tbl_sponsorship_requests.update_one(
            {"_id": ObjectId(request_id)},
            {"$set": {"status": "verified", "verified_at": datetime.utcnow()}},
        )

        return jsonify({"message": "Sponsorship request verified"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# /////////////////////////////////////////////////////////

# @app.route("/socialworker/pending-sponsorships", methods=["GET"])
# def get_pending_sponsorships():
#     try:
#         # 🔹 Step 1: Fetch all sponsorship requests
#         requests = list(
#             mongo.db.tbl_sponsorship_requests.find({
#                 "status": {"$in": ["pending", "verified", "approved", "sponsored"]}
#             })
#         )

#         cleaned = []

#         # 🔹 OPTIONAL OPTIMIZATION: preload collections (FAST)
#         login_ids = [r.get("mom_login_id") for r in requests if r.get("mom_login_id")]

#         login_map = {
#             str(l["_id"]): l
#             for l in mongo.db.tbl_login.find({
#                 "_id": {"$in": [ObjectId(x) for x in login_ids if x]}
#             })
#         }

#         user_map = {
#             str(u["login_id"]): u
#             for u in mongo.db.tbl_user.find({
#                 "login_id": {"$in": [ObjectId(x) for x in login_ids if x]}
#             })
#         }

#         child_ids = [r.get("child_id") for r in requests if r.get("child_id")]

#         child_map = {
#             str(c["_id"]): c
#             for c in mongo.db.tbl_children.find({
#                 "_id": {"$in": [ObjectId(x) for x in child_ids if x]}
#             })
#         }

#         # 🔹 Step 2: Build response
#         for r in requests:
#             temp = dict(r)

#             # Convert ObjectIds → string
#             for key in temp:
#                 if isinstance(temp[key], ObjectId):
#                     temp[key] = str(temp[key])

#             # 🔹 CHILD
#             child = child_map.get(str(r.get("child_id")))
#             temp["child_name"] = child["name"] if child else "Unknown"

#             # 🔹 MOM LOGIN
#             mom_login_id = r.get("mom_login_id")
#             login = login_map.get(str(mom_login_id)) if mom_login_id else None

#             # 🔹 MOM USER
#             mom = user_map.get(str(mom_login_id)) if mom_login_id else None

#             # 🔹 SAFE ASSIGNMENT
#             temp["mom_name"] = mom.get("name") if mom else "N/A"
#             temp["mom_phone"] = mom.get("contact") if mom else "N/A"
#             temp["mom_address"] = mom.get("address") if mom else "N/A"
#             temp["mom_email"] = login.get("email") if login else "N/A"

#             cleaned.append(temp)

#         return jsonify(cleaned), 200

#     except Exception as e:
#         print("🔥 ERROR fetching sponsorships:", e)
#         return jsonify({"error": "Failed to fetch sponsorships"}), 500
@app.route("/socialworker/pending-sponsorships", methods=["GET"])
def get_pending_sponsorships():
    try:
        requests = list(mongo.db.tbl_sponsorship_requests.find({
            "status": {"$in": ["pending", "verified", "approved", "sponsored"]}
        }))

        cleaned = []

        for r in requests:
            temp = dict(r)

            # convert ObjectIds
            for key in temp:
                if isinstance(temp[key], ObjectId):
                    temp[key] = str(temp[key])

            # 🔴 FIX: FORCE STRING ID
            mom_login_id = str(r.get("mom_login_id")) if r.get("mom_login_id") else None

            print("🟡 MOM LOGIN ID:", mom_login_id)

            # 🔥 IMPORTANT: DIRECT DB QUERY (no map confusion)
            login = mongo.db.tbl_login.find_one({
                "_id": ObjectId(mom_login_id)
            }) if mom_login_id else None

            mom = mongo.db.tbl_user.find_one({
                "login_id": ObjectId(mom_login_id)
            }) if mom_login_id else None

            print("🟢 LOGIN:", login)
            print("🟢 MOM:", mom)

            temp["mom_name"] = mom["name"] if mom else "N/A"
            temp["mom_phone"] = mom["contact"] if mom else "N/A"
            temp["mom_address"] = mom["address"] if mom else "N/A"
            temp["mom_email"] = login["email"] if login else "N/A"

            cleaned.append(temp)

        return jsonify(cleaned), 200

    except Exception as e:
        print("🔥 ERROR:", e)
        return jsonify({"error": "Failed"}), 500
# //////////////////////////////////////////////
@app.route("/socialworker/reject-sponsorship/<request_id>", methods=["PUT"])
def social_reject_sponsorship(request_id):
    try:
        mongo.db.tbl_sponsorship_requests.update_one(
            {"_id": ObjectId(request_id)},
            {"$set": {"status": "rejected", "rejected_at": datetime.utcnow()}},
        )

        return jsonify({"message": "Request rejected"})

    except Exception as e:
        return jsonify({"error": str(e)})


# ////////////////////////////////////////////////////////////
@app.route("/admin/assign-social-worker/<request_id>", methods=["PUT"])
def assign_social_worker(request_id):
    try:
        data = request.json or {}
        worker_id = data.get("social_worker_id")

        print("REQUEST ID:", request_id)
        print("WORKER ID:", worker_id)

        if not worker_id:
            return jsonify({"error": "Worker ID missing"}), 400

        request_data = mongo.db.tbl_mom_requests.find_one({"_id": ObjectId(request_id)})

        if not request_data:
            return jsonify({"error": "Request not found"}), 404

        items = request_data.get("items", [])

        inventory = mongo.db.tbl_inventory.find_one({"_id": "main_inventory"})

        if not inventory:
            return jsonify({"error": "Inventory not found"}), 400

        # 🔥 CHECK INVENTORY
        for item in items:
            item_name = item["item"]
            required_qty = int(item["quantity"])
            available_qty = int(inventory.get(item_name, 0))

            if available_qty < required_qty:
                return jsonify({"error": f"Not enough {item_name} in stock"}), 400

        # 🔥 DEDUCT INVENTORY
        for item in items:
            item_name = item["item"]
            qty = int(item["quantity"])

            mongo.db.tbl_inventory.update_one(
                {"_id": "main_inventory"}, {"$inc": {item_name: -qty}}
            )

        # 🔥 ASSIGN WORKER
        worker = mongo.db.tbl_login.find_one({"_id": ObjectId(worker_id)})

        if not worker:
            return jsonify({"error": "Worker not found"}), 404

        mongo.db.tbl_mom_requests.update_one(
            {"_id": ObjectId(request_id)},
            {
                "$set": {
                    "social_worker_id": ObjectId(worker_id),
                    "worker_name": worker.get("username"),
                    "status": "assigned",
                }
            },
        )

        # 🔔 CREATE NOTIFICATION FOR SOCIAL WORKER
        mongo.db.tbl_notifications.insert_one(
            {
                "user_id": ObjectId(worker_id),
                "user_type": "socialworker",
                "type": "assignment",
                "message": f"You have been assigned a new charity task (Request ID: {request_id})",
                "read": False,
                "created_at": datetime.utcnow(),
            }
        )

        return jsonify({"message": "Assigned successfully"})

    except Exception as e:
        print("ASSIGN ERROR:", e)
        return jsonify({"error": str(e)}), 500


# ///////////////////////////////////////////////////////////////////////
@app.route("/admin/social-workers", methods=["GET"])
def get_social_workers():

    workers = list(mongo.db.tbl_login.find({"usertype": "socialworker"}))

    result = []

    for w in workers:
        result.append(
            {
                "worker_id": str(w["_id"]),
                "name": w.get("username"),
                "email": w.get("email"),
            }
        )

    return jsonify(result)


# ///////////////////////////////////////////////////////////////
# @app.route("/admin/charity-requests")
# def get_charity_requests():

#     requests = list(mongo.db.tbl_charity_requests.find({"status": "pending"}))

#     result = []

#     for r in requests:
#         result.append(
#             {
#                 "request_id": str(r["_id"]),
#                 "purpose": r.get("purpose"),
#                 "amount": r.get("amount"),
#             }
#         )

#     return jsonify(result)


# ///////////////////////////////////////////////////////////


@app.route("/worker/assigned-requests/<worker_id>", methods=["GET"])
def get_assigned_requests(worker_id):
    try:
        requests = list(
            mongo.db.tbl_mom_requests.find({"social_worker_id": ObjectId(worker_id)})
        )

        result = []

        for r in requests:
            result.append(
                {
                    "request_id": str(r["_id"]),
                    "items": r.get("items"),
                    "status": r.get("status"),
                    "created_at": r.get("created_at"),
                }
            )

        return jsonify(result)

    except Exception as e:
        print("WORKER REQUEST ERROR:", e)
        return jsonify([])

@app.route("/socialworker/assigned-charity/<worker_id>", methods=["GET"])
def get_assigned_charity(worker_id):
    try:
        requests = list(
            mongo.db.tbl_mom_requests.find(
                {"social_worker_id": ObjectId(worker_id), "status": "assigned"}
            )
        )

        result = []

        for r in requests:
            mom_login_id = r.get("mom_login_id")

            mom_details = {}
            login_details = {}

            if mom_login_id:
                # 🔹 fetch login (email)
                login_details = mongo.db.tbl_login.find_one(
                    {"_id": ObjectId(mom_login_id)}
                )

                # 🔹 fetch mom profile
                mom_details = mongo.db.tbl_user.find_one(
                    {"login_id": ObjectId(mom_login_id)}
                )

            result.append(
                {
                    "request_id": str(r["_id"]),
                    "items": r.get("items"),
                    "status": r.get("status"),
                    "created_at": r.get("created_at"),

                    # ✅ ADD THESE
                    "mom_name": mom_details.get("name") if mom_details else "N/A",
                    "mom_address": mom_details.get("address") if mom_details else "N/A",
                    "mom_phone": mom_details.get("contact") if mom_details else "N/A",
                    "mom_email": login_details.get("email") if login_details else "N/A",
                }
            )

        return jsonify(result)

    except Exception as e:
        print("CHARITY FETCH ERROR:", e)
        return jsonify([])


# @app.route("/socialworker/mark-delivered/<request_id>", methods=["PUT"])
# def mark_delivered_charity(request_id):
#     mongo.db.tbl_mom_requests.update_one(
#         {"_id": ObjectId(request_id)}, {"$set": {"status": "completed", "delivered_at": datetime.utcnow()}}
#     )
#     return jsonify({"message": "Done"})


# ///////////////////////////////////////////////////////////////////////
@app.route("/socialworker/complete-charity/<request_id>", methods=["PUT"])
def complete_charity(request_id):

    mongo.db.tbl_mom_requests.update_one(
        {"_id": ObjectId(request_id)}, {"$set": {"status": "completed"}}
    )

    return jsonify({"message": "Charity completed"})


# //////////////////////////////////////////////////////////////////////
@app.route("/socialworker/mom-requests/<worker_id>", methods=["GET"])
def worker_requests(worker_id):

    requests = list(
        mongo.db.tbl_mom_requests.find(
            {"social_worker_id": ObjectId(worker_id), "status": "assigned"}
        )
    )

    result = []

    for r in requests:
        result.append(
            {
                "request_id": str(r["_id"]),
                "purpose": r.get("purpose"),
                "amount": r.get("amount"),
            }
        )

    return jsonify(result)


# ///////////////////////////////////////////////////////////////////////


@app.route("/socialworker/mark-delivered/<request_id>", methods=["PUT"])
def mark_delivered_charity(request_id):
    try:
        now = datetime.utcnow()
        print("TIME NOW:", now)

        result = mongo.db.tbl_mom_requests.update_one(
            {"_id": ObjectId(request_id)},
            {"$set": {"status": "completed", "delivered_at": now}},
        )

        print("UPDATED:", result.modified_count)

        return jsonify({"message": "Delivery completed"})

    except Exception as e:
        print("DELIVERY ERROR:", e)
        return jsonify({"error": "Failed"})


@app.route("/socialworker/collect-donation/<donation_id>", methods=["PUT"])
def collect_donation(donation_id):
    try:
        data = request.json or {}
        worker_id = data.get("worker_id")

        print("DONATION ID:", donation_id)
        print("WORKER ID:", worker_id)

        if not worker_id:
            return jsonify({"error": "Worker ID required"}), 400

        donation = mongo.db.tbl_donations.find_one({"_id": ObjectId(donation_id)})

        if not donation:
            return jsonify({"error": "Donation not found"}), 404

        if donation.get("status") == "collected":
            return jsonify({"error": "Already collected"}), 400

        items = donation.get("items", [])

        # 🔥 UPDATE INVENTORY
        for item in items:
            item_name = item["item"]
            qty = int(item["quantity"])

            mongo.db.tbl_inventory.update_one(
                {"_id": "main_inventory"},
                {"$inc": {item_name: qty}},  # ✅ ADD, NOT SUBTRACT
                upsert=True,
            )

        # 🔥 UPDATE DONATION STATUS
        mongo.db.tbl_donations.update_one(
            {"_id": ObjectId(donation_id)},
            {
                "$set": {
                    "status": "collected",
                    "collected_by": ObjectId(worker_id),
                    "collected_at": datetime.utcnow(),
                }
            },
        )

        return jsonify({"message": "Donation collected and inventory updated"})

    except Exception as e:
        print("COLLECT ERROR:", e)
        return jsonify({"error": "Failed to collect donation"}), 500


# ///////////////////////////////////////////////////////////////////////


# ///////////////////////NEWWWW////////////////////////////////////////////////
@app.route("/api/notifications", methods=["POST"])
def create_notification():
    try:
        data = request.json
        user_id = data["user_id"]
        user_type = data.get("user_type", "socialworker")
        type_ = data["type"]
        message = data["message"]

        notification = {
            "user_id": ObjectId(user_id),
            "user_type": user_type,
            "type": type_,
            "message": message,
            "read": False,
            "created_at": datetime.utcnow(),
        }

        res = mongo.notifications.insert_one(notification)
        return jsonify({"success": True, "notification_id": str(res.inserted_id)}), 201

    except Exception as e:
        print("CREATE NOTIFICATION ERROR:", e)
        return jsonify({"success": False, "error": str(e)}), 500
    # ////////////////////////////////////////////////////////////


@app.route("/notifications/<user_id>", methods=["GET"])
def get_notifications(user_id):
    try:
        user_obj_id = ObjectId(user_id)

        notes = list(
            mongo.db.tbl_notifications.find(
                {
                    "$or": [
                        # 🟢 Individual notifications
                        {"user_id": user_obj_id, "read": False},
                        # 🔴 Common notifications (not completed)
                        {"user_type": "socialworker", "completed": False},
                    ]
                }
            ).sort("created_at", -1)
        )

        clean_notes = []
        for n in notes:
            clean_notes.append(
                {
                    "_id": str(n["_id"]),
                    "type": n.get("type"),
                    "message": n.get("message"),
                    "created_at": (
                        n.get("created_at").isoformat() if n.get("created_at") else ""
                    ),
                }
            )

        return jsonify(clean_notes)

    except Exception as e:
        print("ERROR:", e)
        return jsonify([])


# ///////////////////////////////////////////////////////////////////
# Mark notification as read
@app.route("/notifications/mark-read/<notification_id>", methods=["PUT"])
def mark_notification_read(notification_id):
    try:
        notif = mongo.db.tbl_notifications.find_one({"_id": ObjectId(notification_id)})

        if not notif:
            return jsonify({"error": "Not found"}), 404

        # 🔴 Common notification → complete globally
        if notif.get("user_type") == "socialworker" and "completed" in notif:
            mongo.db.tbl_notifications.update_one(
                {"_id": ObjectId(notification_id)}, {"$set": {"completed": True}}
            )

        # 🟢 Individual notification → mark read
        else:
            mongo.db.tbl_notifications.update_one(
                {"_id": ObjectId(notification_id)}, {"$set": {"read": True}}
            )

        return jsonify({"message": "Updated"})

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": str(e)}), 500
    #//////////////////////////////////////////////////////////////
@app.route("/admin/notifications/mark-read-by-type/<type>", methods=["PUT"])
def mark_notification_by_type(type):
    try:
        mongo.db.tbl_notifications.update_many(
            {
                "user_type": "admin",
                "type": type,
                "completed": False
            },
            {"$set": {"completed": True}}
        )

        return jsonify({"message": "All marked as read"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
# /////////////////////////////////////////////////////////////////

@app.route(
    "/socialworker/handle-notification/<notification_id>/<worker_id>", methods=["PUT"]
)
def handle_notification(notification_id, worker_id):
    try:
        mongo.db.tbl_notifications.update_one(
            {"_id": ObjectId(notification_id)},
            {"$addToSet": {"handled_by": ObjectId(worker_id)}, "$set": {"read": True}},
        )
        return jsonify({"message": "Notification handled"}), 200
    except Exception as e:
        print("HANDLE NOTIFICATION ERROR:", e)
        return jsonify({"error": "Failed to handle notification"}), 500
# ////////////////////////////////////////////////////////////////////////

@app.route("/admin/notifications/<user_id>", methods=["GET"])
def get_admin_notifications(user_id):
    try:
        notes = list(
            mongo.db.tbl_notifications.find(
                {
                    "$or": [
                        {"user_id": ObjectId(user_id), "read": False},
                        {"user_type": "admin", "completed": False},
                    ]
                }
            ).sort("created_at", -1)
        )

        clean_notes = []
        for n in notes:
            clean_notes.append(
                {
                    "_id": str(n["_id"]),
                    "type": n.get("type"),
                    "message": n.get("message"),
                    "created_at": n.get("created_at").isoformat() if n.get("created_at") else "",
                }
            )

        return jsonify(clean_notes)
    except Exception as e:
        print("ADMIN NOTIFICATION ERROR:", e)
        return jsonify([])

# ///////////////////////////////////////////////////////////////////////
@app.route("/change-password/<string:login_id>", methods=["PUT"])
def change_charity_password(login_id):
    try:
        data = request.get_json()
        old_password = data.get("oldPassword")
        new_password = data.get("newPassword")

        if not old_password or not new_password:
            return jsonify({"message": "Both old and new password are required"}), 400

        login_user = mongo.db.tbl_login.find_one({"_id": ObjectId(login_id)})
        if not login_user:
            return jsonify({"message": "User not found"}), 404

        # Compare old password directly (plain text)
        if login_user["password"] != old_password:
            return jsonify({"message": "Old password is incorrect"}), 400

        # Update with new password (plain text for now)
        mongo.db.tbl_login.update_one(
            {"_id": ObjectId(login_id)}, {"$set": {"password": new_password}}
        )

        return jsonify({"message": "Password changed successfully"}), 200

    except Exception as e:
        print(e)
        return jsonify({"message": "Internal server error"}), 500
    
@app.route("/admin/notifications-count/<admin_id>", methods=["GET"])
def admin_notifications_count(admin_id):
    try:
        counts = {
    "charity_registration": mongo.db.tbl_notifications.count_documents({
        "user_type": "admin",
        "type": "charity_registration",
        "completed": False
    }),
    "jobprovider_registration": mongo.db.tbl_notifications.count_documents({
        "user_type": "admin",
        "type": "jobprovider_registration",
        "completed": False
    }),
    "mom_request": mongo.db.tbl_notifications.count_documents({
        "user_type": "admin",
        "type": "mom_request",
        "completed": False
    }),
    "job_post_request": mongo.db.tbl_notifications.count_documents({
        "user_type": "admin",
        "type": "job_post_request",
        "completed": False
    }),
}
        return jsonify(counts)
    except Exception as e:
        print("ERROR:", e)
        return jsonify({
            "charity_verification": 0,
            "jobprovider_verification": 0,
            "mom_requests": 0,
            "job_post_request": 0
        })
        

@app.route("/forgot-password", methods=["POST"])
def forgot_password():
    try:
        data = request.json
        email = data.get("email")

        user = mongo.db.tbl_login.find_one({"email": email})

        if not user:
            return jsonify({"error": "User not found"}), 404

        # 🔐 generate token
        token = str(uuid.uuid4())

        mongo.db.tbl_password_reset.insert_one({
            "user_id": user["_id"],
            "token": token,
            "expires_at": datetime.utcnow() + timedelta(minutes=10),
            "used": False
        })

        # ⚡ RETURN TOKEN (no email for now)
        return jsonify({
            "message": "Token generated",
            "token": token   # 👈 frontend will use this
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500        
@app.route("/reset-password", methods=["POST"])
def reset_password():
    try:
        data = request.json
        token = data.get("token")
        new_password = data.get("password")

        record = mongo.db.tbl_password_reset.find_one({
            "token": token,
            "used": False
        })

        if not record:
            return jsonify({"error": "Invalid token"}), 400

        if record["expires_at"] < datetime.utcnow():
            return jsonify({"error": "Token expired"}), 400

        # 🔄 update password
        mongo.db.tbl_login.update_one(
            {"_id": record["user_id"]},
            {"$set": {"password": new_password}}
        )

        # ✅ mark used
        mongo.db.tbl_password_reset.update_one(
            {"_id": record["_id"]},
            {"$set": {"used": True}}
        )

        return jsonify({"message": "Password reset successful"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route("/socialworker/dashboard/<login_id>", methods=["GET"])
def socialworker_dashboard(login_id):
    try:
        sw_id = ObjectId(login_id)

        # ✅ ONLY this social worker
        total_pickups = mongo.db.tbl_donations.count_documents({
            "status": "collected",
            "collected_by": sw_id
        })

        # ✅ global (all pending moms)
        pending_verifications = mongo.db.tbl_user.count_documents({
            "verification_status": "pending"
        })

        # ✅ ONLY this social worker
        donations_given = mongo.db.tbl_mom_requests.count_documents({
            "status": "completed",
            "social_worker_id": sw_id
        })

        return jsonify({
            "total_pickups": total_pickups,
            "pending_verifications": pending_verifications,
            "donations_given": donations_given
        })

    except Exception as e:
        print("DASHBOARD ERROR:", e)
        return jsonify({"error": str(e)}), 500
    
@app.route("/reject-mom/<id>", methods=["PUT"])
def reject_mom(id):
    mongo.db.tbl_user.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"verification_status": "rejected"}}
    )
    return jsonify({"message": "Mom rejected"})
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
