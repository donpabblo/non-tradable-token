var express = require('express');
var path = require('path');
const bodyParser = require('body-parser');

var apiRouter = require('./routes/api');

var app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api', apiRouter);

module.exports = app;
