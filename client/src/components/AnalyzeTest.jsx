import { useContext } from "react";
import { AnalyzeContext } from "../context/AnalyzeContext.jsx";

const AnalyzeTest = () => {
    const { response, loading, analyzeMessage } = useContext(AnalyzeContext);

    const requestTest = {
        messageText: "This is a test message for analysis.",
        context: {
            channel: "private",
            senderType: "stranger",
            feeling: "uncomfortable"
        }
    };

    const handleClick = () => {
        analyzeMessage(requestTest);
    }
    return (
        <div>
            <h1>Analyze Test Component</h1>
            <button onClick={handleClick}>Analyze Message</button>
            {response && <pre>{JSON.stringify(response, null, 2)}</pre>}
            <p>Loading: {loading ? 'true' : 'false'}</p>
        </div>
    );
}

export default AnalyzeTest;