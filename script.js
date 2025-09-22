let tasks = [];
let currentTime = 0;

// Add Task
function addTask() {
  const id = document.getElementById("taskId").value.trim();
  const arrival = parseInt(document.getElementById("arrivalTime").value);
  const burst = parseInt(document.getElementById("burstTime").value);
  const priority = parseInt(document.getElementById("priority").value);

  if (!id || isNaN(arrival) || isNaN(burst) || isNaN(priority) || arrival < 0 || burst < 1 || priority < 1) {
    showNotification("Please fill all fields with valid values!", "error");
    return;
  }

  if (tasks.some(task => task.id === id)) {
    showNotification("Task ID already exists!", "error");
    return;
  }

  tasks.push({
    id, 
    arrival, 
    burst, 
    priority, 
    remaining: burst,
    completed: false,
    startTime: -1,
    completionTime: -1,
    waitingTime: 0,
    turnaroundTime: 0
  });

  updateTaskTable();
  updateStats();
  clearInputs();
  showNotification(`Task ${id} added successfully!`, "success");
  document.getElementById("emptyState").style.display = "none";
}

// Clear Input Fields
function clearInputs() {
  document.getElementById("taskId").value = "";
  document.getElementById("arrivalTime").value = "";
  document.getElementById("burstTime").value = "";
  document.getElementById("priority").value = "";
}

// Delete Task
function deleteTask(taskId) {
  tasks = tasks.filter(task => task.id !== taskId);
  updateTaskTable();
  updateStats();
  showNotification(`Task ${taskId} deleted!`, "info");
  
  if (tasks.length === 0) {
    document.getElementById("emptyState").style.display = "block";
    document.getElementById("resultsSection").style.display = "none";
  }
}

// Clear All Tasks
function clearAll() {
  if (tasks.length === 0) return;
  
  tasks = [];
  updateTaskTable();
  updateStats();
  document.getElementById("resultsSection").style.display = "none";
  document.getElementById("emptyState").style.display = "block";
  showNotification("All tasks cleared!", "info");
}

// Update Task Table
function updateTaskTable() {
  const tbody = document.querySelector("#taskTable tbody");
  tbody.innerHTML = "";
  
  tasks.forEach((task, index) => {
    const row = document.createElement("tr");
    row.className = "task-row";
    row.style.animationDelay = `${index * 0.1}s`;
    row.innerHTML = `
      <td><strong>${task.id}</strong></td>
      <td>${task.arrival}</td>
      <td>${task.burst}</td>
      <td>${task.priority}</td>
      <td><button class="delete-btn" onclick="deleteTask('${task.id}')">Delete</button></td>
    `;
    tbody.appendChild(row);
  });
}

// Update Stats
function updateStats() {
  document.getElementById("totalTasks").textContent = tasks.length;
  
  if (tasks.length > 0) {
    const avgBurst = (tasks.reduce((sum, task) => sum + task.burst, 0) / tasks.length).toFixed(1);
    const avgPriority = (tasks.reduce((sum, task) => sum + task.priority, 0) / tasks.length).toFixed(1);
    
    document.getElementById("avgBurst").textContent = avgBurst;
    document.getElementById("avgPriority").textContent = avgPriority;
  } else {
    document.getElementById("avgBurst").textContent = "0";
    document.getElementById("avgPriority").textContent = "0";
  }
}

// Run Scheduler
function runScheduler() {
  if (tasks.length === 0) { 
    showNotification("Add some tasks first!", "error"); 
    return; 
  }

  const algorithm = document.getElementById("algorithm").value;
  let scheduled = [];

  switch(algorithm) {
    case 'priority':
      scheduled = [...tasks].sort((a, b) => a.priority - b.priority || a.arrival - b.arrival);
      break;
    case 'sjf':
      scheduled = [...tasks].sort((a, b) => a.burst - b.burst || a.arrival - b.arrival);
      break;
    case 'fcfs':
      scheduled = [...tasks].sort((a, b) => a.arrival - b.arrival);
      break;
    case 'rr':
      scheduled = simulateRoundRobin();
      break;
  }

  calculateMetrics(scheduled, algorithm);
  displayResults(scheduled, algorithm);
  displayGanttChart(scheduled);
  document.getElementById("resultsSection").style.display = "block";
  showNotification("Scheduling completed!", "success");
}

// Round Robin Simulation
function simulateRoundRobin() {
  const quantum = 3; 
  let ready = [];
  let scheduled = [];
  let currentTime = 0;
  let tasksCopy = tasks.map(t => ({...t, remaining: t.burst}));
  
  while (tasksCopy.some(t => !t.completed)) {
    tasksCopy.forEach(task => {
      if (task.arrival <= currentTime && !task.completed && !ready.includes(task)) {
        ready.push(task);
      }
    });
    
    if (ready.length > 0) {
      let currentTask = ready.shift();
      let executeTime = Math.min(quantum, currentTask.remaining);
      
      if (currentTask.startTime === -1) {
        currentTask.startTime = currentTime;
      }
      
      currentTask.remaining -= executeTime;
      currentTime += executeTime;
      
      scheduled.push({...currentTask, executeTime, startTime: currentTime - executeTime});
      
      if (currentTask.remaining === 0) {
        currentTask.completed = true;
        currentTask.completionTime = currentTime;
      } else {
        ready.push(currentTask); 
      }
    } else {
      currentTime++;
    }
  }
  
  return scheduled;
}

// Calculate Metrics
function calculateMetrics(scheduled, algorithm) {
  if (algorithm === 'rr') return; 
  
  let currentTime = 0;
  
  scheduled.forEach(task => {
    if (currentTime < task.arrival) currentTime = task.arrival;
    
    task.startTime = currentTime;
    task.completionTime = currentTime + task.burst;
    task.turnaroundTime = task.completionTime - task.arrival;
    task.waitingTime = task.turnaroundTime - task.burst;
    
    currentTime = task.completionTime;
  });
}

// Display Results Table
function displayResults(scheduled, algorithm) {
  let resultHTML = `<h3>📋 Execution Order (${algorithm.toUpperCase()})</h3>`;
  resultHTML += "<table><tr><th>Task</th><th>Arrival</th><th>Burst</th><th>Start</th><th>Completion</th><th>Waiting</th><th>Turnaround</th></tr>";
  
  let totalWait = 0, totalTurnaround = 0;
  
  scheduled.forEach(t => {
    if (algorithm !== 'rr' || t.remaining === 0) {
      totalWait += t.waitingTime || 0;
      totalTurnaround += t.turnaroundTime || 0;
      resultHTML += `<tr>
        <td><strong>${t.id}</strong></td>
        <td>${t.arrival}</td>
        <td>${t.burst}</td>
        <td>${t.startTime || 0}</td>
        <td>${t.completionTime || 0}</td>
        <td>${t.waitingTime || 0}</td>
        <td>${t.turnaroundTime || 0}</td>
      </tr>`;
    }
  });
  
  resultHTML += "</table>";
  document.getElementById("resultsTable").innerHTML = resultHTML;
  
  const avgWait = (totalWait / tasks.length).toFixed(2);
  const avgTurnaround = (totalTurnaround / tasks.length).toFixed(2);
  
  document.getElementById("metrics").innerHTML = `
    <div class="metric">
      <div class="metric-value">${avgWait}</div>
      <div class="metric-label">Avg Waiting Time</div>
    </div>
    <div class="metric">
      <div class="metric-value">${avgTurnaround}</div>
      <div class="metric-label">Avg Turnaround Time</div>
    </div>
  `;
}

// Display Gantt Chart
function displayGanttChart(scheduled) {
  const ganttDiv = document.getElementById("gantt");
  const chartArea = ganttDiv.querySelector(".gantt-header").nextElementSibling || document.createElement("div");
  chartArea.innerHTML = "";
  
  const maxTime = Math.max(...scheduled.map(t => (t.completionTime || t.startTime + t.burst || 0)));
  let timeScale = "<div class='time-scale'>";
  for (let i = 0; i <= maxTime; i++) timeScale += `<div class='time-unit'>${i}</div>`;
  timeScale += "</div>";
  chartArea.innerHTML = timeScale;
  
  scheduled.forEach((t, index) => {
    const bar = document.createElement("div");
    bar.className = "bar";
    const width = (t.executeTime || t.burst) * 40;
    bar.style.width = width + "px";
    
    const hue = (index * 360 / scheduled.length) % 360;
    bar.style.background = `linear-gradient(45deg, hsl(${hue}, 70%, 50%), hsl(${hue + 30}, 70%, 60%))`;
    bar.innerText = `${t.id} (${t.executeTime || t.burst})`;
    
    chartArea.appendChild(bar);
  });
  
  ganttDiv.appendChild(chartArea);
}

// Notifications
function showNotification(message, type) {
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 600;
    z-index: 1000;
    animation: slideInRight 0.3s ease;
    max-width: 300px;
  `;
  
  const colors = {
    success: 'linear-gradient(45deg, #4CAF50, #45a049)',
    error: 'linear-gradient(45deg, #f44336, #da190b)',
    info: 'linear-gradient(45deg, #2196F3, #0b7dda)'
  };
  
  notification.style.background = colors[type] || colors.info;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = "slideOutRight 0.3s ease";
    setTimeout(() => document.body.removeChild(notification), 300);
  }, 3000);
}

// Add animation styles dynamically
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from { transform: translateX(300px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(300px); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Initialize
updateStats();
