import { createRoot } from "react-dom/client";
import App from "./App";

const rootEl = document.querySelector<HTMLDivElement>("#app");

if (!rootEl) {
  throw new Error("UI 初始化失败：缺少根节点 #app");
}

createRoot(rootEl).render(<App />);
