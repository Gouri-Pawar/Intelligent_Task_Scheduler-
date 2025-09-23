from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/schedule", methods=["POST"])
def schedule():
    data = request.get_json()
    tasks = data.get("tasks", [])
    algorithm = data.get("algorithm", "fcfs")

    if not tasks:
        return jsonify({"error": "No tasks provided"}), 400

    # Scheduling algorithms
    if algorithm == "fcfs":
        scheduled = sorted(tasks, key=lambda t: t["arrival"])
    elif algorithm == "sjf":
        scheduled = sorted(tasks, key=lambda t: (t["burst"], t["arrival"]))
    elif algorithm == "priority":
        scheduled = sorted(tasks, key=lambda t: (t["priority"], t["arrival"]))
    elif algorithm == "rr":
        scheduled = simulate_round_robin(tasks, quantum=3)
    else:
        return jsonify({"error": "Invalid algorithm"}), 400

    # Calculate metrics (non-RR)
    if algorithm != "rr":
        current_time = 0
        for task in scheduled:
            if current_time < task["arrival"]:
                current_time = task["arrival"]
            task["startTime"] = current_time
            task["completionTime"] = current_time + task["burst"]
            task["turnaroundTime"] = task["completionTime"] - task["arrival"]
            task["waitingTime"] = task["turnaroundTime"] - task["burst"]
            current_time = task["completionTime"]

    return jsonify({"scheduled": scheduled, "algorithm": algorithm})


def simulate_round_robin(tasks, quantum=3):
    ready = []
    scheduled = []
    current_time = 0
    tasks_copy = [
        {**t, "remaining": t["burst"], "completed": False, "startTime": -1}
        for t in tasks
    ]

    while any(not t["completed"] for t in tasks_copy):
        for task in tasks_copy:
            if task["arrival"] <= current_time and not task["completed"] and task not in ready:
                ready.append(task)

        if ready:
            current_task = ready.pop(0)
            execute_time = min(quantum, current_task["remaining"])

            if current_task["startTime"] == -1:
                current_task["startTime"] = current_time

            current_task["remaining"] -= execute_time
            current_time += execute_time

            scheduled.append({
                **current_task,
                "executeTime": execute_time,
                "startTime": current_time - execute_time,
                "completionTime": current_time if current_task["remaining"] == 0 else None
            })

            if current_task["remaining"] == 0:
                current_task["completed"] = True
            else:
                ready.append(current_task)
        else:
            current_time += 1

    return scheduled


if __name__ == "__main__":
    app.run(debug=True)
