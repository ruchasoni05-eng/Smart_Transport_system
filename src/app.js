import express from 'express';
import cors from 'cors';
import path from 'path';
import apiRouter from './routes/api.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Disable browser caching for static assets during development
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

// Serve static assets from public folder
app.use(express.static(path.resolve('public')));

// Mount API router
app.use('/api', apiRouter);

// Frontend Page Routing
app.get('/', (req, res) => {
  res.sendFile(path.resolve('public/login.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.resolve('public/login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.resolve('public/dashboard.html'));
});

app.get('/trips', (req, res) => {
  res.sendFile(path.resolve('public/trips.html'));
});

app.get('/fleet', (req, res) => {
  res.sendFile(path.resolve('public/fleet.html'));
});

app.get('/drivers', (req, res) => {
  res.sendFile(path.resolve('public/drivers.html'));
});

app.get('/maintenance', (req, res) => {
  res.sendFile(path.resolve('public/maintenance.html'));
});

app.get('/expenses', (req, res) => {
  res.sendFile(path.resolve('public/expenses.html'));
});

app.get('/analytics', (req, res) => {
  res.sendFile(path.resolve('public/analytics.html'));
});

app.get('/settings', (req, res) => {
  res.sendFile(path.resolve('public/settings.html'));
});

app.get('/driver', (req, res) => {
  res.sendFile(path.resolve('public/driver.html'));
});

// Fallback to login or 404
app.use((req, res) => {
  res.status(404).redirect('/');
});

export default app;
