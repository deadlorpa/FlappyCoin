var express = require('express');
var router = express.Router();
let obf = require('../modules/obfuscate');

/* GET home page. */
router.get('/', async function(req, res, next) {
  obf.ObfuscatedCode;
  res.render('index', { title: 'Express' });
});

module.exports = router;
