// import { useState } from "react";
// import FirstButton from "../common/FirstButton/FirstButton.jsx";

// const apiUrl = import.meta.env.VITE_SERVER_API_URL;

// const AnalyzeMessage = () => {
//   const [messageText, setMessageText] = useState("");
//   const [response, setResponse] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleAnalyze = async () => {
//     setLoading(true);
//     setResponse("");

//     const res = await fetch(`${apiUrl}/api/analyze`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         messageText,
//         context: {
//           channel: "private",
//           senderType: "stranger",
//           feeling: "uncomfortable",
//         },
//       }),
//     });

//     const data = await res.json();
//     setResponse(data.responseText);
//     setLoading(false);
//   };

//   return (
//     <div>
//       <textarea
//         placeholder="כתבי כאן הודעה לניתוח..."
//         value={messageText}
//         onChange={(e) => setMessageText(e.target.value)}
//         rows={4}
//         style={{ width: "100%", maxWidth: 600 }}
//       />

//       <FirstButton onClick={handleAnalyze} disabled={!messageText || loading}>
//         {loading ? "מנתח..." : "Analyze message"}
//       </FirstButton>

//       {response && (
//         <div style={{ marginTop: 20 }}>
//           <h3>Response</h3>
//           <p>{response}</p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AnalyzeMessage;


import { useState } from "react";
import FirstButton from "../common/FirstButton/FirstButton.jsx";

const apiUrl = import.meta.env.VITE_SERVER_API_URL || "http://localhost:5000";


const AnalyzeMessage = () => {
  const [messageText, setMessageText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`${apiUrl}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageText,
          context: {
            channel: "private",
            senderType: "stranger",
            feeling: "uncomfortable",
          },
        }),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);

      const data = JSON.parse(text);
      setResult(data);
    } catch (e) {
      setError(e.message || "Failed to analyze");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <textarea
        placeholder="כתבי כאן הודעה לניתוח..."
        value={messageText}
        onChange={(e) => setMessageText(e.target.value)}
        rows={4}
        style={{ width: "100%", maxWidth: 600 }}
      />

      <FirstButton onClick={handleAnalyze} disabled={!messageText.trim() || loading}>
        {loading ? "מנתח..." : "Analyze message"}
      </FirstButton>

      {error && <p style={{ marginTop: 12 }}>{error}</p>}

      {result && (
        <div style={{ marginTop: 20 }}>
          <h3>Result</h3>
          <p><b>Risk:</b> {result.riskLevel}</p>
          <p><b>Category:</b> {result.category}</p>
          <p><b>Explanation:</b> {result.explanation}</p>

          <h4>Reply options</h4>
          <ul>
            <li><b>Gentle:</b> {result.replyOptions?.gentle}</li>
            <li><b>Assertive:</b> {result.replyOptions?.assertive}</li>
            <li><b>No reply:</b> {result.replyOptions?.noReply}</li>
          </ul>

          <p><b>Support line:</b> {result.supportLine}</p>
        </div>
      )}
    </div>
  );
};

export default AnalyzeMessage;