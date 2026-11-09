import express from 'express';
import cors from 'cors';
import { apiRouter } from './apiRouter.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount API router
app.use('/api', apiRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'CampusBridge Complaint Management API' });
});

app.listen(PORT, () => {
  console.log(`[CampusBridge Server] Running on http://localhost:${PORT}`);
});
