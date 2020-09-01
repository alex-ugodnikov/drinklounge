const express = require('express');
const router = express.Router();
const axios = require('axios');

const Post = require('../models/Post.model');

// require image uploader

const fileUploader = require('../configs/cloudinary.config');
const {
  response
} = require('express');

/* GET all drinks page */

router.get('/alldrinks', (req, res, next) => {
  axios
    .get('https://www.thecocktaildb.com/api/json/v1/1/search.php?f=a')

    .then(responseFromAPI => {
      // handle success
      console.log(responseFromAPI);
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

  if (letter !== undefined) { // if any letter was clicked

    axios.get(`https://www.thecocktaildb.com/api/json/v1/1/search.php?f=${letter}`)
      .then((responseFromAPI) => {
        // handle success
        console.log(responseFromAPI);
        res.render('drinks/search.hbs', {
          letter: letter,
          cocktails: responseFromAPI.data.drinks
        });
      })
      .catch((error) => {
        // handle error
        console.log(error);
      });

  } else if (s !== undefined) { // if input was submitted
    axios.get(`https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${s}`)
      .then((responseFromAPI) => {
        // handle success
        console.log(responseFromAPI);
        res.render('drinks/search.hbs', {
          s: s,
          cocktails: responseFromAPI.data.drinks
        });
      })
      .catch((error) => {
        // handle error
        console.log(error);
      });

  } else { // if no option was selected, showing basic search page
    res.render('drinks/search.hbs');
  }
});

//GET route - show details for a Random Drink

router.get('/random', (req, res, next) => {
  axios.get(`https://www.thecocktaildb.com/api/json/v1/1/random.php`).then(responseFromApi => {
      console.log(responseFromApi.data);
      res.render('drinks/details.hbs', {
        cocktails: responseFromApi.data.drinks
      });
    })
    .catch(err => console.log(`error getting drink details: ${err}`))
});

//GET route - show details for a single drink

router.get('/drinks/:id', (req, res, next) => {
  const drinkId = req.params.id;

  axios.get(`https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${drinkId}`)
    .then(responseFromApi => {
      console.log(responseFromApi.data);
      res.render('drinks/details.hbs', {
        cocktails: responseFromApi.data.drinks,
        idDrink: drinkId
      });
    })
})


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