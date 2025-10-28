import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
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
      "date-fns", // Keep here for dependency optimization
    ],
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      // Remove date-fns from external (this was the main issue)
      external: [], // Empty unless you have actual external dependencies
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
  },
});
