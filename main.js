const express = require('express');
const morgan = require('morgan');
const envelopeRouter = require('./routes/envelope');

const app = express();
const port = 3000;

app.use(express.json());
app.use(morgan('dev'));
app.use(express.static('public'));

app.use('/envelope', envelopeRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}.`);
});
