const express = require('express');
const morgan = require('morgan');
const path = require('path');
const envelopeRouter = require('./routes/envelope');
const updatePoolRouter = require('./routes/update-pool');

const app = express();
const port = 3000;

app.use(express.json());
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/envelope', envelopeRouter);
app.use('/api/update-pool', updatePoolRouter);

app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on our end! Please try again.' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}.`);
});
