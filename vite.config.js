import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import express from 'express';
import cors from 'cors';
import { apiRouter } from './server/apiRouter.js';

function expressApiPlugin() {
  return {
    name: 'express-api-plugin',
    configureServer(server) {
      const app = express();
      app.use(cors());
      app.use(express.json({ limit: '10mb' }));
      app.use(express.urlencoded({ extended: true, limit: '10mb' }));
      app.use('/api', apiRouter);
      server.middlewares.use(app);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), expressApiPlugin()],
  server: {
    port: 5173,
  },
});
