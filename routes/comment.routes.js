const express = require('express');
const router = express.Router();

const Drink = require('../models/Drink.model');
const Comment = require('../models/Comment.model');

// drink route - to save to database a new comment on a specific drink
router.post('/drinks/:drinkId/comment', (req, res, next) => {
  const { drinkId } = req.params;
  const { content } = req.body;

  // 1. find a Drink based on the id from the url
  Drink.findOne({drinkId})
    .then(drinkFromDb => {
      // Check if the Drink is already in our Db, if not, we need to create it
        if (drinkFromDb === null) {
          console.log('No drink with this ID', drinkId)
          //Create a record of the drink with the id
          Drink.create({drinkId})
          .then(newDrinkFromDb => {
            Comment.create({ content, author: req.session.loggedInUser._id })
            .then(newCommentFromDb => {
              // Save the post with the new comments on it to the database
              Drink.findByIdAndUpdate(newDrinkFromDb._id, {$push:{comments:newCommentFromDb._id}})
                .then(updatedDrink => res.redirect(`/drinks/${updatedDrink.drinkId}`))
                .catch(err => console.log(`Err while saving a comment in a drink: ${err}`));
            })
            .catch(err => console.log(`Err while creating a comment on a drink: ${err}`));
          })
          .catch(err => console.log(`Err while creating a new drink: ${err}`));
        }else{
                Comment.create({ content, author: req.session.loggedInUser._id })
                .then(newCommentFromDb => {
                  // Save the post with the new comments on it to the database
                  Drink.findByIdAndUpdate(drinkFromDb._id, {$push:{comments:newCommentFromDb._id}})
                    .then(updatedDrink => res.redirect(`/drinks/${updatedDrink.drinkId}`))
                    .catch(err => console.log(`Err while saving a comment in a drink: ${err}`));
                })
                .catch(err => console.log(`Err while creating a comment on a drink: ${err}`));       
        } 
        })
    .catch(err => console.log(`Err while getting a single drink when creating a comment: ${err}`));
});

module.exports = router;
