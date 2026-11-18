import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  server: {
    port: 5174, // Укажите нужный вам порт
    strictPort: true, // Опционально: если порт занят, Vite выдаст ошибку, а не переключится на другой
  },
});
