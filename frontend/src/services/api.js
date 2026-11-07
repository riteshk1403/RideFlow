import axios from "axios";

const getBaseUrl = () => {
    if (process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL;
    }
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        return `http://${window.location.hostname}:8080/api`;
    }
    return "https://rideflow-0lqz.onrender.com/api";
};

const API = axios.create({
    baseURL: getBaseUrl()
});

export default API;
