const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const app = express();

app.use(cors());
app.use(express.json());

/* ================================
   GEMINI AI
================================ */

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is missing in .env");
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  vertexai: false,
});

/* ================================
   HOME ROUTE
================================ */

app.get("/", (req, res) => {
  res.json({
    message: "ScamShield AI Backend is running 🚀",
  });
});

/* ================================
   AI ANALYSIS
================================ */

app.post("/api/analyze", async (req, res) => {
  const { text, companyName, website } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({
      message: "Job or internship details are required.",
    });
  }

  const prompt = `
You are ScamShield AI.

Your job is to help students evaluate job and internship opportunities
for possible scam indicators.

IMPORTANT:
Do NOT claim with certainty that an opportunity is a scam.
This is a risk assessment tool, not a legal or cybersecurity guarantee.

Analyze this opportunity carefully.

Company Name:
${companyName || "Not provided"}

Website:
${website || "Not provided"}

Job / Internship Details:
${text}

Look for indicators such as:

- Registration fees
- Application fees
- Security deposits
- Requests for money
- Requests for OTP or sensitive information
- Suspicious links
- Fake-looking domains
- Unrealistic salary
- Unrealistic work-from-home claims
- Urgent pressure
- Poor or suspicious communication
- Fake selection messages
- Guaranteed job promises
- Missing company information
- Suspicious contact details
- Requests to move communication to unusual channels
- Lack of verifiable information

Return ONLY valid JSON.

Use exactly this structure:

{
  "riskScore": 0,
  "riskLevel": "Low Risk",
  "summary": "Short explanation of the analysis.",
  "redFlags": [
    "Example red flag"
  ],
  "positiveSignals": [
    "Example positive signal"
  ],
  "recommendation": "Short safety recommendation."
}

Risk score rules:

0-30 = Low Risk
31-60 = Suspicious
61-100 = High Risk

Rules:

1. riskScore must be a number between 0 and 100.
2. riskLevel must be exactly:
   "Low Risk"
   "Suspicious"
   or
   "High Risk"
3. Do not invent facts about the company.
4. If information is missing, mention the uncertainty.
5. Clearly separate suspicious indicators from verified facts.
6. Keep the summary concise.
7. Return valid JSON only.
`;

/* ================================
   GEMINI REQUEST WITH RETRY
================================ */

  let lastError = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`🤖 Gemini request attempt ${attempt}/3`);

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const rawText = response.text;

      console.log("✅ Gemini response received");

      let result;

      try {
        result = JSON.parse(rawText);
      } catch (parseError) {
        console.error("❌ JSON Parse Error:");
        console.error(rawText);

        return res.status(500).json({
          message: "AI returned an invalid response.",
        });
      }

      /* ================================
         BASIC RESULT VALIDATION
      ================================= */

      const riskScore = Number(result.riskScore);

      if (
        Number.isNaN(riskScore) ||
        riskScore < 0 ||
        riskScore > 100
      ) {
        return res.status(500).json({
          message: "AI returned an invalid risk score.",
        });
      }

      result.riskScore = Math.round(riskScore);

      if (!Array.isArray(result.redFlags)) {
        result.redFlags = [];
      }

      if (!Array.isArray(result.positiveSignals)) {
        result.positiveSignals = [];
      }

      if (!result.summary) {
        result.summary = "No summary was provided.";
      }

      if (!result.recommendation) {
        result.recommendation =
          "Verify the opportunity independently before sharing personal information or making payments.";
      }

      return res.json(result);

    } catch (error) {
      lastError = error;

      console.error(
        `❌ Gemini API Error on attempt ${attempt}:`,
        error.message
      );

      /* Retry only temporary availability errors */

      if (
        error.status === 503 ||
        error.status === 429
      ) {
        if (attempt < 3) {
          console.log("⏳ Temporary error. Retrying...");

          await new Promise((resolve) =>
            setTimeout(resolve, 2000 * attempt)
          );

          continue;
        }
      }

      break;
    }
  }

  /* ================================
     FINAL ERROR
  ================================= */

  console.error("❌ Gemini request failed:", lastError);

  if (lastError?.status === 503) {
    return res.status(503).json({
      message:
        "Gemini model is temporarily busy. Please wait a few seconds and try again.",
    });
  }

  if (lastError?.status === 429) {
    return res.status(429).json({
      message:
        "Gemini API request limit reached. Please wait and try again.",
    });
  }

  return res.status(500).json({
    message: "AI analysis failed. Please try again.",
  });
});

/* ================================
   SERVER
================================ */

const PORT = 5000;

app.listen(PORT, () => {
  console.log("=================================");
  console.log("🛡️ ScamShield AI Backend");
  console.log("=================================");
  console.log(`🚀 Server: http://localhost:${PORT}`);
  console.log("🤖 Gemini AI: Connected");
  console.log("=================================");
});