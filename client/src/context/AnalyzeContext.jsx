import { createContext, useState } from "react";
import PropTypes from "prop-types";
import api from '../services/api';

const AnalyzeContext = createContext();

const AnalyzeProvider = ({ children }) => {
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const analyzeMessage = async (request) => {
        setLoading(true);
        setError(null);

        try {
            const res = await api.post('/api/reports', request);
            setResponse(res.data);
        } catch (error) {
            console.error('Error analyzing the message:', error);
            setError(error);
            setResponse(null);
        } finally {
            setLoading(false);
        }
    };

    return ( <AnalyzeContext.Provider value = {{response, loading, error, analyzeMessage}} >{children}</AnalyzeContext.Provider>);
}

AnalyzeProvider.propTypes = {
    children: PropTypes.node.isRequired
}

export { AnalyzeContext, AnalyzeProvider };