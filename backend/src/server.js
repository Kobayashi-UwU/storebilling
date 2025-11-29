import express from 'express';
import cors from 'cors';
import itemsRouter from './routes/items.js';
import billsRouter from './routes/bills.js';
import { errorHandler } from './middleware/errorHandler.js';
import { config } from './config.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/items', itemsRouter);
app.use('/bills', billsRouter);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Backend running on port ${config.port}`);
});
