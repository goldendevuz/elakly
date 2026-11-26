import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../../extension/filter.js"; // the demo runs the extension's own rules
import { App } from "./App";
import "./style.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
