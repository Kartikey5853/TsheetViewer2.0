import axios from "axios";

const apiClient = axios.create({
  baseURL: "https://tsheetviewer2-0.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;
