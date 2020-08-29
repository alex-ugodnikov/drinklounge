const express = require('express');
const router = express.Router();

/* GET home page */
router.get('/', (req, res) => res.render('index', { title: 'DrinkLounge - Home' }));

module.exports = router;
