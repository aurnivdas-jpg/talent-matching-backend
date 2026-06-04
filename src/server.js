const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const { testConnection } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const jobRoutes = require('./routes/jobRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const membershipRoutes = require('./routes/membershipRoutes');

const app = express();
const PORT = process.env.PORT || 5050;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/health', async (req, res) => {
  try {
    const database = await testConnection();
    res.json({
      status: 'OK',
      service: 'Talent Matching PostgreSQL Backend',
      database: 'connected',
      databaseTime: database.current_time
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      service: 'Talent Matching PostgreSQL Backend',
      database: 'not connected',
      error: error.message
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/membership', membershipRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((error, req, res, next) => {
  res.status(500).json({ message: 'Internal server error', error: error.message });
});

app.listen(PORT, () => {
  console.log(`Talent Matching PostgreSQL Backend running on port ${PORT}`);
});
