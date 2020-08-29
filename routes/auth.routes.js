// routes/auth.routes.js

const {
  Router
} = require('express');
const router = new Router();
const bcryptjs = require('bcryptjs');
const mongoose = require('mongoose');

const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
const saltRounds = 10;
const User = require('../models/User.model');
const routeGuard = require('../configs/route-guard.config');
const apiUrl = require('../public/javascripts/script');

////////////////////////////////////////////////////////////////////////
///////////////////////////// SIGNUP //////////////////////////////////
////////////////////////////////////////////////////////////////////////

// .get() route ==> to display the signup form to users
router.get('/signup', (req, res) => {
  res.render('auth/signup-form.hbs');
  //test: 
  console.log(apiUrl);
});

// .post() route ==> to process form data
router.post('/signup', (req, res, next) => {
  const {
    username,
    email,
    password
  } = req.body;

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
router.get('/edit-profile', (req, res) => res.render('users/edit-profile.hbs'))

//.post() profile route ==> to process updated profile data
router.post('/edit-profile/:userId', (req, res, next) => {
  const {
    proposedUser,
    proposedEmail,
    proposedPassword
  } = req.body;

  if (!proposedUser && !proposedEmail && !proposedPassword) {
    res.render('users/edit-profile.hbs', {
      errorMessage: 'Please update at least one field to save changes to your profile.'
    });
    return;
  }

  // make sure passwords are strong:
  if (!regex.test(proposedPassword)) {
    res.status(500).render('users/edit-profile.hbs', {
      errorMessage: 'New password needs to have at least 6 chars and must contain at least one number, one lowercase and one uppercase letter.'
    });
    return;
  }

  //IN PROGRESS - need to figure out how to implement hashing passwords on update - A. Garcia

  // bcryptjs
  //   .genSalt(saltRounds)
  //   .then(salt => bcryptjs.hash(proposedPassword, salt))
  //   .then(updatedHash => {
  //     console.log(proposedUser, proposedEmail, updatedHash)
  //     return User.update({
  //       username: proposedUser,
  //       email: proposedEmail,
  //       passwordHash: updatedHash
  //     });
  //   })
  //   .then(updatedUser => {
  //     console.log('user credentials updated:', updatedUser);
  //     res.redirect('/profile');
  //   })
  //   .catch(error => {
  //     if (error instanceof mongoose.Error.ValidationError) {
  //       res.status(500).render('users/edit-profile.hbs', {
  //         errorMessage: error.message
  //       });
  //     } else if (error.code === 11000) {
  //       res.status(500).render('users/edit-profile.hbs', {
  //         errorMessage: 'Username and email need to be unique. Either username or email is already used.'
  //       });
  //     } else {
  //       next(error);
  //     }
  //   });
})


////////////////////////////////////////////////////////////////////////
///////////////////////////// LOGIN ////////////////////////////////////
////////////////////////////////////////////////////////////////////////

// .get() route ==> to display the login form to users
router.get('/login', (req, res) => res.render('auth/login-form.hbs'));

// .post() login route ==> to process form data
router.post('/login', (req, res, next) => {
  const {
    email,
    password
  } = req.body;

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
  // add code here
  res.session.destroy();

  res.redirect('/');
});

router.get('/profile', routeGuard, (req, res) => {
  res.render('users/user-profile.hbs');
});

module.exports = router;