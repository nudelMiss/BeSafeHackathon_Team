import { useContext } from "react";
import { AnalyzeContext } from "../context/AnalyzeContext.jsx";

const AnalyzeTest = () => {
  const { response, loading, error, analyzeMessage } = useContext(AnalyzeContext);

  const requestTest = {
    messageText: "This is a test message for analysis.",
    context: {
      channel: "private",
      senderType: "stranger",
      feeling: "uncomfortable",
    },
    ResponsibleAdultEmail: "yuvalh6200@gmail.com"
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <h1>Analyze Test Component</h1>

      <button onClick={() => analyzeMessage(requestTest)} disabled={loading}>
        {loading ? "Analyzing..." : "Analyze Message"}
      </button>

      {error && (
        <p style={{ color: "red", marginTop: 16 }}>
          Server error – check console
        </p>
      )}

      {response && (
        <div style={{ marginTop: 24 }}>
          <h3>Server Response:</h3>

          <p><b>Risk level:</b> {response.riskLevel}</p>
          <p><b>Category:</b> {response.category}</p>
          <p><b>Explanation:</b> {response.explanation}</p>

          {response.replyOptions && (
            <>
              <h4>Reply options:</h4>
              <ul>
                <li><b>Gentle:</b> {response.replyOptions.gentle}</li>
                <li><b>Assertive:</b> {response.replyOptions.assertive}</li>
                <li><b>No reply:</b> {response.replyOptions.noReply}</li>
              </ul>
            </>
          )}

          {response.supportLine && (
            <p><b>Support:</b> {response.supportLine}</p>
          )}

          {/* ✅ NEW: Professional help section */}
          {response.professionalHelp && (
            <div
              style={{
                marginTop: 16,
                padding: 12,
                border: "1px solid #ddd",
                borderRadius: 12,
              }}
            >
              <h4 style={{ margin: 0 }}>קווי תמיכה 💜</h4>

              {response.professionalHelp.message && (
                <p style={{ marginTop: 8 }}>{response.professionalHelp.message}</p>
              )}

              {Array.isArray(response.professionalHelp.resources) &&
                response.professionalHelp.resources.length > 0 && (
                  <ul style={{ marginTop: 8 }}>
                    {response.professionalHelp.resources.map((r, idx) => (
                      <li key={idx}>
                        <b>{r.name}</b>
                        {r.details ? ` — ${r.details}` : ""}
                      </li>
                    ))}
                  </ul>
                )}
            </div>
          )}

          <details>
            <summary>Raw JSON</summary>
            <pre>{JSON.stringify(response, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default AnalyzeTest;
