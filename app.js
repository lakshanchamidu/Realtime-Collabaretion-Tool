const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const routes = require('./routes');
const {notFound, errorHandler } = require('./middleware/error');

const app = express();

app.use(helmet());
app.use(
    cors({
        origin : ( process.env.CORS_Origin || '*' ).split(','),
        credentials: true,
    })
);

app.use (morgan('dev'));
app.use(express.json({limit: '1mb'}));
app.use(express.urlencoded({ extended: true}));
app.use(cookieParser());

app.use('health', (req, res) => res.json({status: 'ok'}));

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;