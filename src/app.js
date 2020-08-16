const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');

require('dotenv').config();

const middlewares = require('./middlewares');
const api = require('./v1');

const app = express();

app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'This is a non-profitable, fan-made Naruto Charater API, which is open-source and can be found in GitHub. :)',
    link: "https://github.com/Miraglia00/NarutoCharacterAPI"
  });
});

app.use('/v1/', api);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

module.exports = app;
