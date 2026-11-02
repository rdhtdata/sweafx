import express from 'express';
import cors from 'cors';
import { config } from './config';
import apiRoutes from './routes';

const app = express();

app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'SweafEx Operations Platform API',
    segment: 'Segment 1 — Foundation & Master Data CRM',
    timestamp: new Date().toISOString()
  });
});

// Mount API Routes
app.use('/api', apiRoutes);

// Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = config.port;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 SweafEx Backend API running on port ${PORT}`);
    console.log(`📦 Segment 1: Foundation & Master Data CRM active`);
    console.log(`🔒 RBAC & Audit Trail Logging operational`);
    console.log(`=======================================================`);
  });
}

export default app;
