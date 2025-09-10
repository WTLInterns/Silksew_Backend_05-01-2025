const express = require('express')
const router = express.Router()
const {addReview,getReview} = require('../controllers/reviewController.js')

router.post('/add',addReview);
router.get('/',getReview);

module.exports = router;