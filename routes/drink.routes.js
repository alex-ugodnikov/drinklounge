const express = require('express');
const router = express.Router();
const axios = require('axios');

const Drink = require('../models/Drink.model'); 
const Comment = require('../models/Comment.model'); 
const User = require('../models/User.model'); 

// require image uploader

const fileUploader = require('../configs/cloudinary.config');
const {
  response
} = require('express');

//require user model
const User = require('../models/User.model');

/* GET all drinks page */

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

/* GET search drinks page */

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

//GET route - show details for a Random Drink

router.get('/random', (req, res, next) => {
  axios
    .get(`https://www.thecocktaildb.com/api/json/v1/1/random.php`)
    .then(responseFromApi => {
      const drinkId = responseFromApi.data.drinks[0].drinkid;
      //console.log(responseFromApi.data.drinks[0].idDrink);
      Drink.findOne({drinkId})
      .populate('author comments')
      .populate({
        // we are populating author in the previously populated comments
        path: 'comments',
        populate: {
          path: 'author',
          model: 'User'
        }})
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

//GET route - show details for a single drink

//pseudo code to manage array of ingredients with measurements for any drink:
//iterate over every ingredient & measurement
//if ingredient has an associated measurement
//concatenate the strings ("tequila - 1.5")
//else push ingredient as is
//ingredients key (an array of k/v pairs)

router.get('/drinks/:id', (req, res, next) => {
  const drinkId = req.params.id;
<<<<<<< HEAD
<<<<<<< HEAD
  axios.get(`https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${drinkId}`).then(responseFromApi => {
    // const ingredients = [responseFromApi.data.strIngredient1, responseFromApi.data.strMeasure1];
    // const separator = '-';
    //console.log(responseFromApi.data.strIngredient1);
    // function combineIngredientsAndMeasures(object, keys, sep) {
    //   return keys
    //     .map(key => object[key])
    //     .filter(v => v)
    //     .join(sep);
    // }

    res.render('drinks/details.hbs', {
      cocktails: responseFromApi.data.drinks,
      idDrink: drinkId
    });
=======
=======

>>>>>>> afad00ff5d5eb1923ea0b54aeb179c2ce726da3f
  // const ingredients = [responseFromApi.data.strIngredient1, responseFromApi.data.strMeasure1];
  // const separator = '-';
  axios.get(`https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${drinkId}`)
    .then(responseFromApi => {
      //console.log(responseFromApi.data.strIngredient1);
      //pseudo code to manage array of ingredients with measurements for any drink:
      // function combineIngredientsAndMeasures(object, keys, sep) {
      //   return keys
      //     .map(key => object[key])
      //     .filter(v => v)
      //     .join(sep);
      // }
      //iterate over every ingredient & measurement
      //if ingredient has an associated measurement
      //concatenate the strings ("tequila - 1.5")
      //else push ingredient as is

      Drink.findOne({drinkId})
      .populate('author comments')
      .populate({
        // we are populating author in the previously populated comments
        path: 'comments',
        populate: {
          path: 'author',
          model: 'User'
        }})
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
<<<<<<< HEAD
>>>>>>> 097cab7079b5abeb2bce342d18d25c23d228e0cc
=======
>>>>>>> afad00ff5d5eb1923ea0b54aeb179c2ce726da3f
  });
});

// POST route - add a drink to user's Favorites list

router.post('drinks/:drinkId/addFavorite', (req, res, next) => {
  const {
    drinkId
  } = req.params;
  User.findByIdAndUpdate(req.session.loggedInUser._id, {
      favorites: drinkId
    })
    .then(newFavorite => {
      User.save();
      console.log(`favorite added: ${newFavorite}`)
    })
    .catch(err => {
      console.log(`error adding favorite: ${err}`)
    })
})

//POST route - remove a drink from user's Favorites list

// router.post('drinks/:drinkId/removeFavorite', (req, res, next) => {
//   const {
//     drinkId
//   } = req.params;
//   User.findByIdAndUpdate(req.session.loggedInUser._id, )
// })

// GET route - show the details of a single post

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