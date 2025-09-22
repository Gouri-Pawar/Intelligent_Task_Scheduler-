from flask import Flask, render_template, jsonify, request

app = Flask(__name__, static_folder="", template_folder="")

@app.route("/")
def index():
    return render_template("index.html")

# Example API endpoint (if you want backend scheduling)
@app.route("/schedule", methods=["POST"])
def schedule_tasks():
    data = request.json
    tasks = data.get("tasks", [])
    algorithm = data.get("algorithm", "priority")
    # TODO: Add scheduling logic in Python
    result = {"scheduled_tasks": tasks}  # temporary
    return jsonify(result)

if __name__ == "__main__":
    app.run(debug=True)
