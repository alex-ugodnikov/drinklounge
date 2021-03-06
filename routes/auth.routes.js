// routes/auth.routes.js

const { Router } = require('express');
const router = new Router();
const bcryptjs = require('bcryptjs');
const mongoose = require('mongoose');

const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
const saltRounds = 10;
const User = require('../models/User.model');
const routeGuard = require('../configs/route-guard.config');
const apiUrl = require('../public/javascripts/script');
const { default: Axios } = require('axios');

////////////////////////////////////////////////////////////////////////
///////////////////////////// SIGNUP //////////////////////////////////
////////////////////////////////////////////////////////////////////////

// .get() route ==> to display the signup form to users
router.get('/signup', (req, res) => {
  res.render('auth/signup-form.hbs');
  console.log(apiUrl);
});

// .post() route ==> to process form data
router.post('/signup', (req, res, next) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res.render('auth/signup-form.hbs', {
      errorMessage: 'All fields are mandatory. Please provide your username, email and password.'
    });
    return;
  }

  // make sure passwords are strong:
  if (!regex.test(password)) {
    res.status(500).render('auth/signup-form.hbs', {
      errorMessage: 'Password needs to have at least 6 chars and must contain at least one number, one lowercase and one uppercase letter.'
    });
    return;
  }

  bcryptjs
    .genSalt(saltRounds)
    .then(salt => bcryptjs.hash(password, salt))
    .then(hashedPassword => {
      return User.create({
        // username: username
        username,
        email,
        // passwordHash => this is the key from the User model
        //     ^
        //     |            |--> this is placeholder (how we named returning value from the previous method (.hash()))
        passwordHash: hashedPassword
      });
    })
    .then(userFromDB => {
      console.log('Newly created user is: ', userFromDB);
      res.redirect('/login');
    })
    .catch(error => {
      if (error instanceof mongoose.Error.ValidationError) {
        res.status(500).render('auth/signup-form.hbs', {
          errorMessage: error.message
        });
      } else if (error.code === 11000) {
        res.status(500).render('auth/signup-form.hbs', {
          errorMessage: 'Username and email need to be unique. Either username or email is already used.'
        });
      } else {
        next(error);
      }
    }); // close .catch()
}); // close router.post()

////////////////////////////////////////////////////////////////////////
///////////////////////// UPDATE PROFILE ///////////////////////////////
////////////////////////////////////////////////////////////////////////

//.get() route ==> to display the update profile form
router.get('/edit-profile', (req, res) => res.render('users/edit-profile.hbs'));

//.post() profile route ==> to process updated profile data
router.post('/edit-profile', (req, res, next) => {
  const { proposedUser, proposedEmail, proposedPassword } = req.body;

  //check to make sure at least one field is filled out
  if (!proposedUser && !proposedEmail && !proposedPassword) {
    res.render('users/edit-profile.hbs', {
      errorMessage: 'Please update at least one field to save changes to your profile.'
    });
  }

  //if username was updated:
  if (proposedUser) {
    console.log(proposedUser);
    User.findByIdAndUpdate(
      req.session.loggedInUser._id,
      {
        username: proposedUser
      },
      {
        new: true
      }
    )
      .then(updatedUser => {
        console.log(`username updated: ${updatedUser}`);
        res.redirect('/profile');
      })
      .catch(err => {
        //check that username is unique:
        if (err.code === 11000) {
          res.status(500).render('users/edit-profile.hbs', {
            errorMessage: 'Username and email need to be unique. Either username or email is already used.'
          });
        } else console.log(`error updating username: ${err}`);
      });
  }

  //if email was updated:
  if (proposedEmail) {
    console.log(proposedEmail);
    User.findByIdAndUpdate(
      req.session.loggedInUser._id,
      {
        email: proposedEmail
      },
      {
        new: true
      }
    )
      .then(updatedEmail => {
        console.log(`user email updated: ${updatedEmail}`);
        res.redirect('/profile');
      })
      .catch(err => {
        //check that email is unique:
        if (err.code === 11000) {
          res.status(500).render('users/edit-profile.hbs', {
            errorMessage: 'Username and email need to be unique. Either username or email is already used.'
          });
        } else console.log(`error updating email: ${err}`);
      });
  }

  //if password was updated:
  if (proposedPassword) {
    console.log(proposedPassword);
    // make sure passwords are strong:
    if (!regex.test(proposedPassword)) {
      res.status(500).render('users/edit-profile.hbs', {
        errorMessage: 'New password needs to have at least 6 chars and must contain at least one number, one lowercase and one uppercase letter.'
      });
      return;
    }
    //hash the new password:
    bcryptjs
      .genSalt(saltRounds)
      .then(salt => bcryptjs.hash(proposedPassword, salt))
      //update the user with the new password
      .then(hashedPassword => {
        User.findByIdAndUpdate(
          req.session.loggedInUser._id,
          {
            password: hashedPassword
          },
          {
            new: true
          }
        );
      })
      .then(updatedUser => {
        console.log('user password has been updated.');
        res.redirect('/profile');
      })
      .catch(error => {
        if (error instanceof mongoose.Error.ValidationError) {
          res.status(500).render('users/edit-profile.hbs', {
            errorMessage: error.message
          });
        } else {
          next(error);
        }
      });
  }
});

////////////////////////////////////////////////////////////////////////
///////////////////////////// LOGIN ////////////////////////////////////
////////////////////////////////////////////////////////////////////////

// .get() route ==> to display the login form to users
router.get('/login', (req, res) => res.render('auth/login-form.hbs'));

// .post() login route ==> to process form data
router.post('/login', (req, res, next) => {
  const { email, password } = req.body;

  if (email === '' || password === '') {
    res.render('auth/login-form.hbs', {
      errorMessage: 'Please enter both, email and password to login.'
    });
    return;
  }

  User.findOne({
    email
  })
    .then(user => {
      if (!user) {
        res.render('auth/login-form.hbs', {
          errorMessage: 'Email is not registered. Try with other email.'
        });
        return;
      } else if (bcryptjs.compareSync(password, user.passwordHash)) {
        // add code here
        req.session.loggedInUser = user;
        res.redirect('/profile');
      } else {
        res.render('auth/login-form.hbs', {
          errorMessage: 'Incorrect password.'
        });
      }
    })
    .catch(error => next(error));
});

////////////////////////////////////////////////////////////////////////
///////////////////////////// LOGOUT ////////////////////////////////////
////////////////////////////////////////////////////////////////////////

router.post('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// GET route - Access User Profile

router.get('/profile', routeGuard, (req, res) => {
  //check if user has any saved favorites and get the drink data from the API.

  //iterate through the favorites list array and push an axios call for the details of each drink into an empty array.
  let axiosRequest = [];
  // console.log(req.session.loggedInUser)
  req.session.loggedInUser.favorites.forEach(ele => {
    axiosRequest.push(Axios.get(`https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${ele}`));
  });

  //Then, use axios.all to complete all the axios calls in the helper array and user spread operator to return the responses into a new 'responses' array.
  Axios.all(axiosRequest)
    .then(
      Axios.spread((...responses) => {
        drinkData = [];

        //Last, iterate through the responses array created previously and push the data for each drink into a new 'drinkData' array.
        responses.forEach(oneDrink => {
          drinkData.push(oneDrink.data.drinks[0]);
        });

        //the page can now be rendered once with all the drink data returned in one array.

        res.render('users/user-profile.hbs', {
          cocktails: drinkData
        });
        console.log(drinkData);
      })
    )
    .catch(err => {
      console.log(`error getting user profile: ${err}`);
    });
  // }
});

module.exports = router;
