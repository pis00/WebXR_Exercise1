import { defineConfig } from "vite";
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [basicSsl()],
  server: {
    https: true,
    host: "0.0.0.0",
  },
  base: "/WebXR_Exercise1/",
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        scene1: "scene1.html",
        scene2: "scene2.html",
        progetto: "progetto.html",
      },
    },
  },
});