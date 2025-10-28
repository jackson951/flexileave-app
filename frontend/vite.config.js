import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // optional: convenient import alias
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-helmet-async",
      "react-router-dom",
      "react-date-range",
      "jspdf",
      "jspdf-autotable",
      "axios",
      "papaparse",
      "date-fns",
    ],
  },
  build: {
    chunkSizeWarningLimit: 2000, // increases warning threshold to avoid warnings for large chunks
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // split vendor code into separate chunk
            return "vendor";
          }
        },
      },
    },
  },
});
