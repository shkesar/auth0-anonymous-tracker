var express = require('express');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
cors = require('cors');
var uuid = require('node-uuid');
var fs = require('fs');
var jwt = require('jsonwebtoken');

var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(morgan('combined'));
app.use(cookieParser());

app.use(cors({
  // for demo purposes, accept all origins
  origin: true,
  // required for CORS to allow cookie transmission
  credentials: true
}));

// tracker endpoint: called by tracker.js client to get tracker data from cookie
app.get('/tracker', function (req, res) {
  // tracker data object
  var tracker;

  // check for existence of cookie
  if (req.cookies.tracker) {
    // attempt to verify and desierialize the cookie value, which is a JWT
    try {
      tracker = jwt.verify(req.cookies.tracker, process.env.TRACKER_SECRET)
        .tracker;
    } catch (err) {
      console.error('Could not verify/desierialize tracker data from token:', err);
    }
  } else {
    // no cookie, so create one

    // for now tracker data is just an ID, but it could contain more data
    tracker = {
      id: uuid.v4()
    };

    // serialize the tracker data in a JWT so we can verify it when it gets sent back
    var token = jwt.sign({ tracker: tracker }, process.env.TRACKER_SECRET);
    res.cookie('tracker', token, {
      // cookie can only be read server-side
      httpOnly: true,
      // persists for 30 days
      maxAge: 2592000000
    });
  }

  res.json(tracker || {});
});

// tracker.js library used in the browser
var trackerJs;
app.get('/tracker.js', function (req, res) {
  // cache compiled library after first request
  if (!trackerJs) {
    var protocol = req.headers['x-forwarded-proto'] || req.protocol;
    var url = protocol + '://' + req.get('host') + '/tracker';

    // read template file and inject URL
    trackerJs = fs.readFileSync(__dirname + '/tracker.js', { encoding: 'utf-8' })
      .replace('@@URL', url);
  }

  res
    .type('application/javascript')
    .send(trackerJs);
});

app.use('/', express.static(__dirname + '/public'));

app.listen(app.get('port'), function() {
  console.log('Tracker is running on port', app.get('port'));
  console.log('TRACKER_SECRET:', process.env.TRACKER_SECRET);
});
