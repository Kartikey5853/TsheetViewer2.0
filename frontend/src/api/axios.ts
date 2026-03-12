import axios from "axios";

const apiClient = axios.create({
  baseURL: "https://tsheetviewer2-0.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const url = config.url;
  if (typeof url === "string") {
    const isAbsolute = /^https?:\/\//i.test(url);
    if (!isAbsolute && url.startsWith("/") && !url.startsWith("/api")) {
      config.url = `/api${url}`;
    }
  }
  return config;
});

export default apiClient;
