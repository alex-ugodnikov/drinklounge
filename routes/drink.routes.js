const express = require('express');
const router = express.Router();
const axios = require('axios');

const Drink = require('../models/Drink.model');
const Post = require('../models/Post.model');

// require image uploader

const fileUploader = require('../configs/cloudinary.config');
const {
  response
} = require('express');

//require user model
const User = require('../models/User.model');
const {
  TooManyRequests
} = require('http-errors');

//////////////////////////
/* GET all drinks page */
//////////////////////////

router.get('/alldrinks', (req, res, next) => {
  axios
    .get('https://www.thecocktaildb.com/api/json/v1/1/search.php?f=a')

    .then(responseFromAPI => {
      // handle success
      // console.log(responseFromAPI);
      res.render('drinks/list.hbs', {
        cocktails: responseFromAPI.data.drinks
      });
    })
    .catch(error => {
      // handle error
      console.log(error);
    });
});

/////////////////////////////
/* GET search drinks page */
/////////////////////////////

router.get('/search', (req, res, next) => {
  // Pull variables from search query
  const {
    letter,
    s
  } = req.query;

  // Checking if any search variables exist = run apropriate query

  if (letter !== undefined) {
    // if any letter was clicked

    axios
      .get(`https://www.thecocktaildb.com/api/json/v1/1/search.php?f=${letter}`)
      .then(responseFromAPI => {
        // handle success
        console.log(responseFromAPI);
        res.render('drinks/search.hbs', {
          letter: letter,
          cocktails: responseFromAPI.data.drinks
        });
      })
      .catch(error => {
        // handle error
        console.log(error);
      });
  } else if (s !== undefined) {
    // if input was submitted
    axios
      .get(`https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${s}`)
      .then(responseFromAPI => {
        // handle success
        console.log(responseFromAPI);
        res.render('drinks/search.hbs', {
          s: s,
          cocktails: responseFromAPI.data.drinks
        });
      })
      .catch(error => {
        // handle error
        console.log(error);
      });
  } else {
    // if no option was selected, showing basic search page
    res.render('drinks/search.hbs');
  }
});

///////////////////////////////////////////////
//GET route - show details for a Random Drink
///////////////////////////////////////////////

router.get('/random', (req, res, next) => {
  axios
    .get(`https://www.thecocktaildb.com/api/json/v1/1/random.php`)
    .then(responseFromApi => {
      const drinkId = responseFromApi.data.drinks[0].drinkid;
      //console.log(responseFromApi.data.drinks[0].idDrink);
      Drink.findOne({
          drinkId
        })
        .populate('author comments')
        .populate({
          // we are populating author in the previously populated comments
          path: 'comments',
          populate: {
            path: 'author',
            model: 'User'
          }
        })
        .then(foundDrink => {

          console.log(foundDrink);
          res.render('drinks/details.hbs', {
            cocktails: responseFromApi.data.drinks,
            idDrink: drinkId,
            foundDrink
            //ingredients key (an array of k/v pairs)
          });
        })
        .catch(err => console.log(`Err while getting a single post: ${err}`));
    })
    .catch(err => console.log(`error getting drink details: ${err}`));
});

///////////////////////////////////////////////
//GET route - show details for a single drink
///////////////////////////////////////////////

router.get('/drinks/:id', (req, res, next) => {
  const drinkId = req.params.id;

  axios.get(`https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${drinkId}`).then(responseFromApi => {
    Drink.findOne({
        drinkId
      })
      .populate('author comments')
      .populate({
        // we are populating author in the previously populated comments
        path: 'comments',
        populate: {
          path: 'author',
          model: 'User'
        }
      })
      .then(foundDrink => {
        // console.log(foundDrink);
        // console.log(req.session.loggedInUser.favorites)

        // Check if the Drink is already in our Db, if not, we need to create it
        if (foundDrink === null) {
          console.log('No drink with this ID', drinkId);
          //Create a record of the drink with the id
          Drink.create({
            drinkId
          }).then(newDrink => {
            let data = {
              cocktails: responseFromApi.data.drinks,
              idDrink: drinkId,
              newDrink
            };
            //update isAddedToFavorites value to TRUE if user model already contains drinkId in Favorites.
            if (req.session.loggedInUser) {
              newDrink.isAddedToFavorites = req.session.loggedInUser.favorites.includes(data.idDrink);
            }
            res.render('drinks/details.hbs', data);
            // console.log(newDrink.isAddedToFavorites);
          });
        } else {
          let data = {
            cocktails: responseFromApi.data.drinks,
            idDrink: drinkId,
            foundDrink
          };
          //update isAddedToFavorites value to TRUE if user model already contains drinkId in Favorites.
          if (req.session.loggedInUser) {
            foundDrink.isAddedToFavorites = req.session.loggedInUser.favorites.includes(data.idDrink);
          }
          res.render('drinks/details.hbs', data);
          // console.log(foundDrink.isAddedToFavorites);
        }
      })
      .catch(err => console.log(`Err while getting a drink's details: ${err}`));
  });
});

////////////////////////////////////////////////////
// POST route - add a drink to user's Favorites list
////////////////////////////////////////////////////

router.post('/drinks/:drinkId/addFavorite', (req, res, next) => {
  const {
    drinkId
  } = req.params;
  User.findByIdAndUpdate(req.session.loggedInUser._id, {
      $push: {
        favorites: drinkId
      }
    }, {
      new: true
    })
    .then(newFavorite => {
      req.session.loggedInUser = newFavorite;
      console.log(`favorite added: ${newFavorite}`);
      res.redirect(`/drinks/${drinkId}`);
    })
    .catch(err => {
      console.log(`error adding favorite: ${err}`);
    });
});

///////////////////////////////////////////////////////
//POST route - remove a drink from user's Favorites list
///////////////////////////////////////////////////////

router.post('/drinks/:drinkId/removeFavorite', (req, res, next) => {
  const {
    drinkId
  } = req.params;
  User.findByIdAndUpdate(req.session.loggedInUser._id, {
      $pull: {
        favorites: drinkId
      }
    }, {
      new: true
    })
    .then(removedFave => {
      req.session.loggedInUser = removedFave;
      console.log(`favorite removed: ${removedFave}`);
      res.redirect(`/drinks/${drinkId}`);
    })
    .catch(err => {
      console.log(`error removing favorite: ${err}`);
    });
});

///////////////////////////////////////////////////////
// GET route - show the details of a single post
///////////////////////////////////////////////////////

router.get('/posts/:postId', (req, res, next) => {
  Post.findById(req.params.postId)
    // author of a post
    //           VV
    .populate('author comments') // populate both fields - the same as populate one and then populate the other one
    // deep populate ===> populating already populated field
    // check this article: https://stackoverflow.com/questions/18867628/mongoose-deep-population-populate-a-populated-field
    .populate({
      path: 'comments',
      populate: {
        path: 'author' // author of a comment
      }
    })
    .then(foundPost => {
      // console.log(foundPost);
      res.render('posts/details.hbs', {
        post: foundPost
      });
    })
    .catch(err => console.log(`Err while getting a single post: ${err}`));
});

module.exports = router;