let tasks = [];

// Add Task
function addTask() {
  const id = document.getElementById("taskId").value.trim();
  const arrival = parseInt(document.getElementById("arrivalTime").value);
  const burst = parseInt(document.getElementById("burstTime").value);
  const priority = parseInt(document.getElementById("priority").value);

  if (!id || isNaN(arrival) || isNaN(burst) || isNaN(priority)) {
    showNotification("Please fill all fields correctly!", "error");
    return;
  }

  tasks.push({ id, arrival, burst, priority });
  updateTaskTable();
  clearInputs();
  document.getElementById("emptyState").style.display = "none";
}

// Run Scheduler (via Flask API)
async function runScheduler() {
  const algorithm = document.getElementById("algorithm").value;

  try {
    const res = await fetch("/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tasks, algorithm })
    });

    const data = await res.json();

    if (data.error) {
      showNotification(data.error, "error");
      return;
    }

    displayResults(data.scheduled, data.algorithm);
    displayGanttChart(data.scheduled);
    document.getElementById("resultsSection").style.display = "block";
    showNotification("Scheduling completed!", "success");
  } catch (e) {
    console.error(e);
    showNotification("Backend error!", "error");
  }
}

// Helpers
function updateTaskTable() {
  const tbody = document.querySelector("#taskTable tbody");
  tbody.innerHTML = "";
  tasks.forEach((task, idx) => {
    tbody.innerHTML += `
      <tr>
        <td>${task.id}</td>
        <td>${task.arrival}</td>
        <td>${task.burst}</td>
        <td>${task.priority}</td>
        <td><button class="delete-btn" onclick="deleteTask(${idx})">❌ Delete</button></td>
      </tr>
    `;
  });

  document.getElementById("totalTasks").innerText = tasks.length;
  if (tasks.length > 0) {
    document.getElementById("avgBurst").innerText =
      (tasks.reduce((a, b) => a + b.burst, 0) / tasks.length).toFixed(2);
    document.getElementById("avgPriority").innerText =
      (tasks.reduce((a, b) => a + b.priority, 0) / tasks.length).toFixed(2);
  } else {
    document.getElementById("avgBurst").innerText = "0";
    document.getElementById("avgPriority").innerText = "0";
  }
}

function deleteTask(index) {
  tasks.splice(index, 1);
  updateTaskTable();
  if (tasks.length === 0) {
    document.getElementById("emptyState").style.display = "block";
  }
}

function clearInputs() {
  document.getElementById("taskId").value = "";
  document.getElementById("arrivalTime").value = "";
  document.getElementById("burstTime").value = "";
  document.getElementById("priority").value = "";
}

function clearAll() {
  tasks = [];
  updateTaskTable();
  document.getElementById("emptyState").style.display = "block";
  document.getElementById("resultsSection").style.display = "none";
}

function displayResults(scheduled, algo) {
  let html = `<h3>📋 Results (${algo.toUpperCase()})</h3>`;
  html += `<table><tr><th>Task</th><th>Start</th><th>Completion</th><th>Waiting</th><th>Turnaround</th></tr>`;
  scheduled.forEach(t => {
    html += `<tr>
      <td>${t.id}</td>
      <td>${t.startTime ?? "-"}</td>
      <td>${t.completionTime ?? "-"}</td>
      <td>${t.waitingTime ?? "-"}</td>
      <td>${t.turnaroundTime ?? "-"}</td>
    </tr>`;
  });
  html += `</table>`;
  document.getElementById("resultsTable").innerHTML = html;
}

function displayGanttChart(scheduled) {
  const ganttDiv = document.getElementById("gantt");
  ganttDiv.innerHTML = "<h3>📊 Gantt Chart</h3>";
  scheduled.forEach((t) => {
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.width = ((t.executeTime || t.burst) * 40) + "px";
    bar.innerText = t.id;
    ganttDiv.appendChild(bar);
  });
}

function showNotification(msg, type) {
  alert(`[${type.toUpperCase()}] ${msg}`);
}
