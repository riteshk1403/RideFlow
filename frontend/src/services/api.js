import axios from "axios";

const getBaseUrl = () => {
    if (process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL;
    }
    return `http://${window.location.hostname}:8080/api`;
};

const API = axios.create({
    baseURL: getBaseUrl()
});

export default API;
