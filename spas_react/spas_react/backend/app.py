"""
Student Performance Analysis System - Backend
Simple Flask API. Data is stored in data.json (no database needed for prototype).
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)  # allows Flutter app to call this API from a different device/port

DATA_FILE = os.path.join(os.path.dirname(__file__), "data.json")

# ---- Marks configuration ----
MAX_ASSIGNMENTS = 20
MAX_INTERNALS = 50
MAX_EXTERNALS = 80
MAX_TOTAL = MAX_ASSIGNMENTS + MAX_INTERNALS + MAX_EXTERNALS  # 150

PASS_PERCENT = 40          # below this = FAIL
AT_RISK_PERCENT = 50       # between PASS and this = AT RISK (borderline)


# ---------- Helper functions ----------

def load_data():
    """Read all student data from the JSON file."""
    with open(DATA_FILE, "r") as f:
        return json.load(f)


def save_data(data):
    """Write student data back to the JSON file."""
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)


def compute_stats(student):
    """
    Given a student record, calculate total marks, percentage,
    and status (PASS / AT RISK / FAIL). These are never stored -
    always calculated fresh so the JSON stays simple.
    """
    marks = student["marks"]
    total = marks["assignments"] + marks["internals"] + marks["externals"]
    percentage = round((total / MAX_TOTAL) * 100, 2)

    if percentage < PASS_PERCENT:
        status = "FAIL"
    elif percentage < AT_RISK_PERCENT:
        status = "AT RISK"
    else:
        status = "PASS"

    return {
        **student,
        "total": total,
        "max_total": MAX_TOTAL,
        "percentage": percentage,
        "status": status,
    }


# ---------- Routes ----------

@app.route("/students", methods=["GET"])
def get_students():
    """Return every student with computed stats attached."""
    data = load_data()
    result = [compute_stats(s) for s in data["students"]]
    return jsonify(result)


@app.route("/students/<int:student_id>", methods=["GET"])
def get_student(student_id):
    """Return one student's full detail."""
    data = load_data()
    for s in data["students"]:
        if s["id"] == student_id:
            return jsonify(compute_stats(s))
    return jsonify({"error": "Student not found"}), 404


@app.route("/students", methods=["POST"])
def add_student():
    """Add a brand new student record."""
    data = load_data()
    body = request.get_json()

    new_id = max([s["id"] for s in data["students"]], default=0) + 1
    new_student = {
        "id": new_id,
        "name": body["name"],
        "department": body["department"],
        "marks": {
            "assignments": body.get("assignments", 0),
            "internals": body.get("internals", 0),
            "externals": body.get("externals", 0),
        },
    }
    data["students"].append(new_student)
    save_data(data)
    return jsonify(compute_stats(new_student)), 201


@app.route("/students/<int:student_id>/marks", methods=["POST"])
def update_marks(student_id):
    """Update an existing student's marks."""
    data = load_data()
    body = request.get_json()

    for s in data["students"]:
        if s["id"] == student_id:
            s["marks"]["assignments"] = body.get("assignments", s["marks"]["assignments"])
            s["marks"]["internals"] = body.get("internals", s["marks"]["internals"])
            s["marks"]["externals"] = body.get("externals", s["marks"]["externals"])
            save_data(data)
            return jsonify(compute_stats(s))

    return jsonify({"error": "Student not found"}), 404


@app.route("/analytics", methods=["GET"])
def analytics():
    """
    Return department-wise average percentage and the list of at-risk
    (or failing) students. This powers the dashboard screen.
    """
    data = load_data()
    students = [compute_stats(s) for s in data["students"]]

    # Department-wise average
    dept_totals = {}
    dept_counts = {}
    for s in students:
        dept = s["department"]
        dept_totals[dept] = dept_totals.get(dept, 0) + s["percentage"]
        dept_counts[dept] = dept_counts.get(dept, 0) + 1

    dept_averages = [
        {"department": dept, "average_percentage": round(dept_totals[dept] / dept_counts[dept], 2)}
        for dept in dept_totals
    ]

    at_risk_students = [s for s in students if s["status"] in ("AT RISK", "FAIL")]

    return jsonify({
        "dept_averages": dept_averages,
        "at_risk_students": at_risk_students,
        "total_students": len(students),
    })


if __name__ == "__main__":
    # host="0.0.0.0" so a physical phone on the same WiFi can also reach it
    app.run(host="0.0.0.0", port=5000, debug=True)
