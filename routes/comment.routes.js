const express = require('express');
const router = express.Router();

const Drink = require('../models/Drink.model');
const Comment = require('../models/Comment.model');

// drink route - to save to database a new comment on a specific drink
router.post('/drinks/:drinkId/comment', (req, res, next) => {
  const { drinkId } = req.params;
  const { content } = req.body;

  // 1. find a post based on the id from the url
  Drink.findOne({drinkId: 178316})
    .then(drinkFromDb => {
      // 2. create a new comment
        if (drinkFromDb === null) {
          console.log('No drink with this ID', drinkId)
          //Create a record of the drink with the id
          Drink.create({drinkId})
          .then(newDrinkFromDb => {
            drinkFromDb = newDrinkFromDb;
          })
          .catch(err => console.log(`Err while creating a new drink: ${err}`));
        } 
        Comment.create({ content, author: req.session.loggedInUser._id })
            .then(newCommentFromDb => {
              // console.log(newCommentFromDb);
              // 3. push the new comment's id into an array of comments that belongs to the found post
              drinkFromDb.comments.push(newCommentFromDb._id);
              // 4. save the post with the new comments on it to the database
              drinkFromDb
                .save()
                .then(updatedPost => res.redirect(`/drinks/${updatedPost._id}`))
                .catch(err => console.log(`Err while saving a comment in a drink: ${err}`));
            })
            .catch(err => console.log(`Err while creating a comment on a drink: ${err}`));
        })
    .catch(err => console.log(`Err while getting a single drink when creating a comment: ${err}`));
});

module.exports = router;
