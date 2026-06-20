const weightInput = document.getElementById("weight");
const goalInput = document.getElementById("goal");
const saveWeightBtn = document.getElementById("saveWeightBtn");
const saveGoalBtn = document.getElementById("saveGoalBtn");
const weightMessage = document.getElementById("weightMessage");
const goalMessage = document.getElementById("goalMessage");
const remainingText = document.getElementById("remainingText");

let chart;

function today() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getRecords() {
  const records = JSON.parse(localStorage.getItem("weightRecords") || "[]");
  const byDate = {};

  records.forEach(record => {
    if (record.date && record.weight) {
      byDate[record.date] = record;
    }
  });

  const cleaned = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
  localStorage.setItem("weightRecords", JSON.stringify(cleaned));
  return cleaned;
}

function saveRecords(records) {
  localStorage.setItem("weightRecords", JSON.stringify(records));
}

function getGoal() {
  return localStorage.getItem("goalWeight") || "";
}

function getLatestWeight() {
  const records = getRecords().sort((a, b) => b.date.localeCompare(a.date));
  return records.length ? Number(records[0].weight) : null;
}

function updateRemaining() {
  const latest = getLatestWeight();
  const goal = Number(getGoal());

  remainingText.classList.remove("achieved");

  if (!latest || !goal) {
    remainingText.textContent = "-- kg";
    return;
  }

  const diff = latest - goal;

  if (diff <= 0) {
    remainingText.textContent = "🎉 目標達成！";
    remainingText.classList.add("achieved");
  } else {
    remainingText.textContent = "あと " + diff.toFixed(1) + " kg";
  }
}

function drawChart() {
  const records = getRecords().sort((a, b) => a.date.localeCompare(b.date));
  const goal = Number(getGoal());

  let labels = records.map(record => record.date.slice(5));
  let weights = records.map(record => Number(record.weight));

  // 1日分しかないと横線にならないので、表示用ラベルを2つにする
  if (labels.length === 0) {
    labels = ["開始", "今日"];
  } else if (labels.length === 1) {
    labels = [labels[0], labels[0] + " "];
    weights = [weights[0], null];
  }

  const datasets = [];

  if (weights.length > 0) {
    datasets.push({
      label: "体重",
      data: weights,
      tension: 0.3,
      pointRadius: 6,
      pointHoverRadius: 8,
      spanGaps: false
    });
  }

  if (goal) {
    datasets.push({
      label: "目標体重",
      data: labels.map(() => goal),
      borderDash: [6, 6],
      pointRadius: 0,
      borderWidth: 3,
      tension: 0
    });
  }

  const ctx = document.getElementById("weightChart");

  if (chart) {
    chart.destroy();
  }

  const allValues = records.map(record => Number(record.weight));
  if (goal) allValues.push(goal);

  chart = new Chart(ctx, {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true }
      },
      scales: {
        y: {
          beginAtZero: false,
          suggestedMin: allValues.length ? Math.min(...allValues) - 1 : undefined,
          suggestedMax: allValues.length ? Math.max(...allValues) + 1 : undefined
        }
      }
    }
  });

  updateRemaining();
}

saveWeightBtn.addEventListener("click", () => {
  if (!weightInput.value) {
    weightMessage.textContent = "体重を入力してください。";
    return;
  }

  const records = getRecords();
  const todayDate = today();
  const existingIndex = records.findIndex(record => record.date === todayDate);

  if (existingIndex >= 0) {
    records[existingIndex].weight = weightInput.value;
    weightMessage.textContent = "今日の記録を上書きしました。";
  } else {
    records.push({ date: todayDate, weight: weightInput.value });
    weightMessage.textContent = "保存しました。";
  }

  saveRecords(records);
  weightInput.value = "";
  drawChart();
});

saveGoalBtn.addEventListener("click", () => {
  if (!goalInput.value) {
    goalMessage.textContent = "目標体重を入力してください。";
    return;
  }

  localStorage.setItem("goalWeight", goalInput.value);
  goalMessage.textContent = "目標体重：" + goalInput.value + "kg";
  drawChart();
});

const savedGoal = getGoal();
if (savedGoal) {
  goalInput.value = savedGoal;
  goalMessage.textContent = "目標体重：" + savedGoal + "kg";
}

drawChart();


const resetBtn = document.getElementById("resetBtn");
if(resetBtn){
  resetBtn.addEventListener("click", () => {
    localStorage.removeItem("weightRecords");
    localStorage.removeItem("goalWeight");
    location.reload();
  });
}
