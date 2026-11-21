const chartInput = document.getElementById("chartInput");
const preview = document.getElementById("preview");
const uploadPrompt = document.getElementById("uploadPrompt");
const analyzeBtn = document.getElementById("analyzeBtn");
const errorBox = document.getElementById("error");
const resultsPanel = document.getElementById("resultsPanel");
const loading = document.getElementById("loading");
const result = document.getElementById("result");

let selectedFile = null;

chartInput.addEventListener("change", () => {
  selectedFile = chartInput.files && chartInput.files[0] ? chartInput.files[0] : null;
  errorBox.hidden = true;
  if (!selectedFile) {
    preview.hidden = true;
    uploadPrompt.hidden = false;
    analyzeBtn.disabled = true;
    return;
  }
  const allowed = ["image/png", "image/jpeg", "image/webp"];
  if (!allowed.includes(selectedFile.type)) {
    showError("Please choose a PNG, JPG or WEBP image.");
    chartInput.value = "";
    selectedFile = null;
    analyzeBtn.disabled = true;
    return;
  }
  if (selectedFile.size > 8 * 1024 * 1024) {
    showError("Image is too large. Maximum size is 8 MB.");
    chartInput.value = "";
    selectedFile = null;
    analyzeBtn.disabled = true;
    return;
  }
  preview.src = URL.createObjectURL(selectedFile);
  preview.hidden = false;
  uploadPrompt.hidden = true;
  analyzeBtn.disabled = false;
});

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

analyzeBtn.addEventListener("click", async () => {
  if (!selectedFile) return;
  errorBox.hidden = true;
  resultsPanel.hidden = false;
  loading.hidden = false;
  result.textContent = "";
  analyzeBtn.disabled = true;
  analyzeBtn.textContent = "ANALYSING…";
  resultsPanel.scrollIntoView({ behavior: "smooth", block: "start" });

  const form = new FormData();
  form.append("chart", selectedFile);
  form.append("timeframe", document.getElementById("timeframe").value);
  form.append("currentPrice", document.getElementById("currentPrice").value.trim());

  try {
    const response = await fetch("/api/analyze", { method: "POST", body: form });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
    result.textContent = data.analysis;
  } catch (err) {
    showError(err.message || "Could not contact the scanner. Please try again.");
  } finally {
    loading.hidden = true;
    analyzeBtn.disabled = !selectedFile;
    analyzeBtn.textContent = "✦ ANALYSE GOLD CHART";
  }
});

document.getElementById("newScan").addEventListener("click", () => {
  chartInput.value = "";
  selectedFile = null;
  preview.removeAttribute("src");
  preview.hidden = true;
  uploadPrompt.hidden = false;
  analyzeBtn.disabled = true;
  result.textContent = "";
  errorBox.hidden = true;
  resultsPanel.hidden = true;
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// Lightweight deployment smoke test in the browser console.
fetch("/health").then(r => r.json()).then(data => {
  if (data.status !== "ok") console.warn("Scanner health check returned an unexpected result.");
}).catch(() => console.warn("Scanner health check could not complete."));
