// backend/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './db.js';
import authRouter from './routes/auth.js';
import workoutRouter from './routes/workout.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/workout', workoutRouter);

app.get('/', (req, res) => {
  res.send('PETS Backend is running!');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
