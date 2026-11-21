const express = require("express");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Please upload a PNG, JPG or WEBP image."));
    }
    cb(null, true);
  }
});

// Serve the frontend from the public folder.
app.use(express.static(PUBLIC_DIR));

app.get("/", (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", app: "AI CHART SCANNER PRO V2" });
});

function getOutputText(data) {
  if (typeof data.output_text === "string") return data.output_text;
  const chunks = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) chunks.push(content.text);
    }
  }
  return chunks.join("\\n").trim();
}

app.post("/api/analyze", upload.single("chart"), async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        error: "AI is not connected. Add OPENAI_API_KEY in Render Environment, then redeploy."
      });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Choose an MT5 chart screenshot first." });
    }

    const timeframe = String(req.body.timeframe || "Not specified").slice(0, 40);
    const currentPrice = String(req.body.currentPrice || "Not supplied").slice(0, 40);
    const imageData = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    const instructions = [
      "You are AI CHART SCANNER PRO V2, an educational chart-analysis assistant focused only on Gold XAUUSD.",
      "Analyze only what is visible in the supplied MetaTrader screenshot.",
      `User timeframe: ${timeframe}. User-supplied current price: ${currentPrice}.`,
      "Assess trend and market structure, swing highs/lows, support/resistance, liquidity sweeps, BOS/CHOCH only when clearly evidenced, displacement, possible fair value gaps/order blocks only when reasonably identifiable, candle confirmation, and visible indicators.",
      "Do not claim an indicator is present if it is not visible. Distinguish observations from interpretations.",
      "Return these headings: VERDICT (BUY / SELL / WAIT), MARKET READ, INSTITUTIONAL EVIDENCE, CONFIRMATIONS, TRADE PLAN, INVALIDATION, MISSING INFORMATION, RISK NOTE.",
      "Give an entry zone, stop loss, TP1, TP2, TP3 and risk:reward only if price labels are readable and a defensible setup exists. Never invent price levels. If unclear or incomplete, verdict must be WAIT and explain the trigger needed.",
      "Use a qualitative confidence label (Low / Moderate / High), not a fabricated statistical probability.",
      "A screenshot is static and cannot confirm live execution conditions, spread, news, or future candles. This is educational decision support, not financial advice. Never promise profit."
    ].join("\\n");

    const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        input: [{
          role: "user",
          content: [
            { type: "input_text", text: instructions },
            { type: "input_image", image_url: imageData, detail: "high" }
          ]
        }]
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = payload.error?.message || `AI service returned HTTP ${response.status}.`;
      return res.status(502).json({ error: message });
    }

    const analysis = getOutputText(payload);
    if (!analysis) {
      return res.status(502).json({ error: "The AI returned an empty report. Try a clearer screenshot." });
    }
    return res.json({ analysis, model });
  } catch (err) {
    const message = err.code === "LIMIT_FILE_SIZE"
      ? "Image is too large. Maximum size is 8 MB."
      : (err.message || "Unexpected server error.");
    return res.status(400).json({ error: message });
  }
});

// Report unexpected routes clearly instead of returning a confusing blank response.
app.use((_req, res) => {
  res.status(404).json({ error: "Page not found. Open the main scanner address." });
});

app.use((err, _req, res, _next) => {
  res.status(400).json({ error: err.message || "Request could not be processed." });
});

app.listen(PORT, () => {
  console.log(`AI CHART SCANNER PRO V2 listening on port ${PORT}`);
  console.log(`Serving frontend from: ${PUBLIC_DIR}`);
});
