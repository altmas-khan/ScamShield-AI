import { useState } from "react";
import "./App.css";

function App() {
  const [text, setText] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyzeOpportunity = async () => {
    if (!text.trim()) {
      setError("Please enter job or internship details.");
      return;
    }

    setLoading(true);
    setResult(null);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          companyName,
          website,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Analysis failed.");
      }

      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Backend connection failed.");
    } finally {
      setLoading(false);
    }
  };

  const getRiskClass = () => {
    if (!result) return "";

    if (result.riskScore <= 30) return "low";
    if (result.riskScore <= 60) return "medium";
    return "high";
  };

  return (
    <div className="app">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo">
          🛡️ ScamShield AI
        </div>

        <span>AI-Powered Internship & Job Scam Detection</span>
      </nav>

      <main className="container">

        {/* HERO */}
        <section className="hero">
          <div className="hero-badge">
            🤖 AI-Powered Safety Assistant
          </div>

          <h1>
            Check Before
            <br />
            <span>You Apply.</span>
          </h1>

          <p>
            Analyze job and internship opportunities for suspicious
            signs before sharing your information or making payments.
          </p>
        </section>

        {/* INPUT CARD */}
        <section className="card">

          <div className="section-title">
            <h2>🔍 Analyze Opportunity</h2>

            <p>
              Paste the job offer, internship message, or recruitment email.
            </p>
          </div>

          <label>Job / Internship Details</label>

          <textarea
            placeholder="Example: Congratulations! You have been selected for our internship. Pay ₹2,000 registration fee to confirm your position..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="input-row">

            <div className="input-group">
              <label>Company Name</label>

              <input
                type="text"
                placeholder="Example: ABC Technologies"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Company Website</label>

              <input
                type="text"
                placeholder="https://example.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

          </div>

          <button
            className="analyze-btn"
            onClick={analyzeOpportunity}
            disabled={loading || !text.trim()}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Analyzing with AI...
              </>
            ) : (
              "🔍 Analyze Opportunity"
            )}
          </button>

          {error && (
            <div className="error-box">
              ⚠️ {error}
            </div>
          )}
        </section>

        {/* RESULT */}
        {result && (
          <section className="result-card">

            <div className="result-header">
              <div>
                <span className="result-label">
                  AI ANALYSIS COMPLETE
                </span>

                <h2>Safety Assessment</h2>
              </div>

              <div className={`risk-badge ${getRiskClass()}`}>
                {result.riskLevel}
              </div>
            </div>

            {/* RISK SCORE */}
            <div className="risk-section">

              <div className={`risk-circle ${getRiskClass()}`}>
                <div>
                  <strong>{result.riskScore}</strong>
                  <span>/100</span>
                </div>

                <small>Risk Score</small>
              </div>

              <div className="risk-summary">
                <h3>AI Summary</h3>

                <p>
                  {result.summary}
                </p>
              </div>

            </div>

            {/* RED FLAGS + POSITIVE SIGNALS */}
            <div className="analysis-grid">

              <div className="analysis-box danger-box">
                <h3>⚠️ Red Flags</h3>

                {result.redFlags &&
                result.redFlags.length > 0 ? (
                  <ul>
                    {result.redFlags.map((flag, index) => (
                      <li key={index}>
                        <span>!</span>
                        {flag}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-text">
                    No major red flags identified from the provided information.
                  </p>
                )}
              </div>

              <div className="analysis-box safe-box">
                <h3>✅ Positive Signals</h3>

                {result.positiveSignals &&
                result.positiveSignals.length > 0 ? (
                  <ul>
                    {result.positiveSignals.map((signal, index) => (
                      <li key={index}>
                        <span>✓</span>
                        {signal}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-text">
                    No strong positive signals identified.
                  </p>
                )}
              </div>

            </div>

            {/* RECOMMENDATION */}
            <div className="recommendation">
              <div className="recommendation-icon">
                🛡️
              </div>

              <div>
                <h3>Safety Recommendation</h3>

                <p>
                  {result.recommendation}
                </p>
              </div>
            </div>

            {/* DISCLAIMER */}
            <div className="disclaimer">
              ⚠️ ScamShield AI provides an AI-based risk assessment.
              It does not guarantee that an opportunity is legitimate
              or fraudulent. Always verify the company independently.
            </div>

          </section>
        )}

        {/* FEATURES */}
        <section className="info">

          <div>
            <span>🔎</span>
            <h3>Red Flag Detection</h3>
            <p>
              Identify suspicious patterns in job and internship offers.
            </p>
          </div>

          <div>
            <span>🤖</span>
            <h3>AI Risk Analysis</h3>
            <p>
              Get an understandable risk assessment powered by AI.
            </p>
          </div>

          <div>
            <span>🛡️</span>
            <h3>Student Safety</h3>
            <p>
              Understand warning signs before sharing information or money.
            </p>
          </div>

        </section>

      </main>
    </div>
  );
}

export default App;