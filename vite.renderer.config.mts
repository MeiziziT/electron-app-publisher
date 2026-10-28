import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// https://vitejs.dev/config
export default defineConfig({
  plugins: [react()],
  resolve: {
    // 核心：强制所有模块解析到同一个 React 物理实例
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    // 核心：确保这些深层入口也被统一预构建
    include: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-dom/client",
    ],
  },
});
