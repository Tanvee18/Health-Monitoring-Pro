document.addEventListener("DOMContentLoaded", () => {
  // ========= Tabs =========
  const tabs = document.querySelectorAll(".nav-tab");
  const tabContents = document.querySelectorAll(".tab-content");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      const target = tab.getAttribute("data-tab");
      tabContents.forEach(tc => {
        tc.classList.toggle("active", tc.id === target);
      });
    });
  });

  // ========= Chatbot =========
  const toggleBtn = document.getElementById("chatbotToggle");
  const closeBtn = document.getElementById("chatbotClose");
  const chatbotWindow = document.getElementById("chatbotWindow");
  const sendBtn = document.getElementById("sendBtn");
  const chatInput = document.getElementById("chatInput");
  const chatMessages = document.getElementById("chatbotMessages");

  toggleBtn.addEventListener("click", () => {
    chatbotWindow.style.display = chatbotWindow.style.display === "flex" ? "none" : "flex";
  });

  closeBtn.addEventListener("click", () => {
    chatbotWindow.style.display = "none";
  });

  function addMessage(text, sender) {
    const msg = document.createElement("div");
    msg.classList.add("message", sender === "user" ? "user-message" : "bot-message");
    msg.textContent = text;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  sendBtn.addEventListener("click", async () => {
    const userMsg = chatInput.value.trim();
    if (!userMsg) return;
    addMessage(userMsg, "user");
    chatInput.value = "";
    addMessage("⏳ Thinking...", "bot");

    try {
      const response = await fetch("http://localhost:3000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await response.json();
      chatMessages.lastChild.remove();
      addMessage(data.reply || "⚠️ Sorry, I couldn’t process that.", "bot");
    } catch (err) {
      console.error(err);
      chatMessages.lastChild.remove();
      addMessage("⚠️ Server error. Please check your backend.", "bot");
    }
  });

  chatInput.addEventListener("keypress", e => {
    if (e.key === "Enter") sendBtn.click();
  });

  // ========= Health Readings =========
  const healthForm = document.getElementById("healthForm");
  const latestReadings = document.getElementById("latestReadings");
  const historyTableBody = document.getElementById("historyTableBody");
  const healthStatus = document.getElementById("healthStatus");

  healthForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const heartRate = document.getElementById("heartRate").value;
    const temperature = document.getElementById("temperature").value;
    const systolicBP = document.getElementById("systolicBP").value;
    const diastolicBP = document.getElementById("diastolicBP").value;
    const weight = document.getElementById("weight").value;
    const bloodSugar = document.getElementById("bloodSugar").value;

    const reading = {
      date: new Date().toLocaleString(),
      heartRate,
      temperature,
      systolicBP,
      diastolicBP,
      weight,
      bloodSugar
    };

    let readings = JSON.parse(localStorage.getItem("readings") || "[]");
    readings.push(reading);
    localStorage.setItem("readings", JSON.stringify(readings));

    updateLatestReading();
    updateHistoryTable();
    updateHealthStatus();
    updateCharts();

    healthForm.reset();
  });

  function updateLatestReading() {
    let readings = JSON.parse(localStorage.getItem("readings") || "[]");
    if (readings.length === 0) {
      latestReadings.innerHTML = "<p>No readings available. Add your first reading!</p>";
      return;
    }
    const last = readings[readings.length - 1];
    latestReadings.innerHTML = `
      <p>Heart Rate: ${last.heartRate} bpm</p>
      <p>Temperature: ${last.temperature} °C</p>
      <p>BP: ${last.systolicBP}/${last.diastolicBP} mmHg</p>
      <p>Weight: ${last.weight} kg</p>
      <p>Blood Sugar: ${last.bloodSugar} mg/dL</p>
      <p>Date: ${last.date}</p>
    `;
  }

  function updateHistoryTable() {
    let readings = JSON.parse(localStorage.getItem("readings") || "[]");
    if (readings.length === 0) {
      historyTableBody.innerHTML = `<tr><td colspan="8" class="no-data">No readings available</td></tr>`;
      return;
    }
    historyTableBody.innerHTML = readings.map(r => `
      <tr>
        <td>${r.date}</td>
        <td>${r.heartRate}</td>
        <td>${r.temperature}</td>
        <td>${r.systolicBP}/${r.diastolicBP}</td>
        <td>${r.weight}</td>
        <td>${r.bloodSugar}</td>
        <td>${getHealthStatus(r)}</td>
        <td><button class="btn btn--danger" onclick="deleteReading('${r.date}')">Delete</button></td>
      </tr>
    `).join("");
  }

  function updateHealthStatus() {
    let readings = JSON.parse(localStorage.getItem("readings") || "[]");
    if (readings.length === 0) {
      healthStatus.innerHTML = `<span class="status status--info">No readings yet</span>`;
      return;
    }
    const last = readings[readings.length - 1];
    healthStatus.innerHTML = `<span class="status status--success">${getHealthStatus(last)}</span>`;
  }

  function getHealthStatus(reading) {
    const hr = parseFloat(reading.heartRate);
    if (hr < 60) return "Low Heart Rate";
    if (hr > 100) return "High Heart Rate";
    return "Normal";
  }

  window.deleteReading = function(date) {
    let readings = JSON.parse(localStorage.getItem("readings") || "[]");
    readings = readings.filter(r => r.date !== date);
    localStorage.setItem("readings", JSON.stringify(readings));
    updateLatestReading();
    updateHistoryTable();
    updateHealthStatus();
    updateCharts();
  }

  // ========= Charts =========
  const hrChartCtx = document.getElementById("heartRateChart").getContext("2d");
  const bpChartCtx = document.getElementById("bloodPressureChart").getContext("2d");
  const tempChartCtx = document.getElementById("temperatureChart").getContext("2d");

  const hrChart = new Chart(hrChartCtx, {
    type: "line",
    data: { labels: [], datasets: [{ label: "Heart Rate (bpm)", data: [], borderColor: "#0077b6", fill: false }] },
    options: { responsive: true }
  });

  const bpChart = new Chart(bpChartCtx, {
    type: "line",
    data: { labels: [], datasets: [
      { label: "Systolic BP", data: [], borderColor: "#00b4d8", fill: false },
      { label: "Diastolic BP", data: [], borderColor: "#90e0ef", fill: false }
    ] },
    options: { responsive: true }
  });

  const tempChart = new Chart(tempChartCtx, {
    type: "line",
    data: { labels: [], datasets: [{ label: "Temperature (°C)", data: [], borderColor: "#0077b6", fill: false }] },
    options: { responsive: true }
  });

  function updateCharts() {
    const readings = JSON.parse(localStorage.getItem("readings") || "[]");
    hrChart.data.labels = readings.map(r => r.date);
    hrChart.data.datasets[0].data = readings.map(r => r.heartRate);
    hrChart.update();

    bpChart.data.labels = readings.map(r => r.date);
    bpChart.data.datasets[0].data = readings.map(r => r.systolicBP);
    bpChart.data.datasets[1].data = readings.map(r => r.diastolicBP);
    bpChart.update();

    tempChart.data.labels = readings.map(r => r.date);
    tempChart.data.datasets[0].data = readings.map(r => r.temperature);
    tempChart.update();
  }

  // Initialize
  updateLatestReading();
  updateHistoryTable();
  updateHealthStatus();
  updateCharts();
});
