const express = require('express');
const morgan = require('morgan');
const envelopeRouter = require('./routes/envelope');

const app = express();
const port = 3000;

app.use(express.json());
app.use(morgan('dev'));
app.use(express.static('public'));

app.use('/api/envelope', envelopeRouter);

app.get('/*', (req, res, next) => {
  if (req.url.startsWith('/api')) {
    next();
    return;
  }

  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on our end! Please try again.' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}.`);
});
