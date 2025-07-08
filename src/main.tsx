import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./config/dayjs"; // Configure dayjs plugins

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
