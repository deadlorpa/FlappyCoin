
const dotenv = require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var compression = require('compression')
var tg = require('./modules/tbot')
var data_ch = require('./modules/data_work')
var app = express();
var seq = require('./modules/sqlz')
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/game', express.static(path.join(__dirname, 'public')));
app.use(compression())


app.use('/game', indexRouter);
app.use('/users', usersRouter);

app.use('/game/send',async function(req, res) {
    let hashlast = req.cookies.hashlast;
    let hashfirst=req.cookies.hash;
    let lastscore=req.cookies.lastscore;
    res.cookie('hash' , '0');
    res.cookie('lastscore', '0');
    res.cookie('hashlast' , '0').send('ok');
    if(await seq.find(hashfirst,  hashlast, lastscore) <= 0)
    {
        if(data_ch.AnylizeCookie(hashfirst,  hashlast, lastscore))
         {
            seq.add(req.body.name, req.body.email, req.body.wallet, hashfirst, hashlast, lastscore)
            tg.Send(req.body.name, req.body.email, req.body.wallet, hashfirst, hashlast, lastscore)

        }
        else
        {
            console.log("1) !!!!!Не обманывай нас :)")
        }
    }
    else
    {
        console.log("(2) !!!!!Не обманывай нас :)")
    }
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
