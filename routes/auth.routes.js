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
const {
  restart
} = require('nodemon');

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
router.post('/edit-profile', (req, res, next) => {
  const {
    proposedUser,
    proposedEmail,
    proposedPassword
  } = req.body;

  //check to make sure at least one field is filled out
  if (!proposedUser && !proposedEmail && !proposedPassword) {
    res.render('users/edit-profile.hbs', {
      errorMessage: 'Please update at least one field to save changes to your profile.'
    })
  }

  //if username was updated: 
  if (proposedUser) {
    User.findByIdAndUpdate({
        _id: req.params.user_id,
        username: proposedUser
      }, {
        new: true
      }
      .then(updatedUser => {
        console.log(`username updated: ${updatedUser}`)
        res.redirect('users/user-profile.hbs')
      })
      .catch(err => {
        //check that username is unique:
        if (err.code === 11000) {
          res.status(500).render('users/edit-profile.hbs', {
            errorMessage: 'Username and email need to be unique. Either username or email is already used.'
          });
        } else console.log(`error updating username: ${err}`)
      })
    )
  }

  //if email was updated:
  if (proposedEmail) {
    User.findByIdAndUpdate({
        _id: req.params.user_id,
        email: proposedEmail
      }, {
        new: true
      }
      .then(updatedEmail => {
        console.log(`user email updated: ${updatedEmail}`)
        res.redirect('users/user-profile.hbs')

      })
      .catch(err => {
        //check that email is unique:
        if (err.code === 11000) {
          res.status(500).render('users/edit-profile.hbs', {
            errorMessage: 'Username and email need to be unique. Either username or email is already used.'
          });
        } else console.log(`error updating email: ${err}`)
      })
    )
  }


  //IN PROGRESS - need to figure out how to implement hashing passwords on update - A. Garcia

  //if password was updated: 
  if (proposedPassword) {
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
      .then(hashedPassword => {
        User.findByIdAndUpdate({
          _id: req.params.user_id,
          password: hashedPassword
        }, {
          new: true
        })
      })
      .then(updatedUser => {
        console.log('user password has been updated.')
        res.redirect('/');
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
  req.session.destroy();
  res.redirect('/');
});

router.get('/profile', routeGuard, (req, res) => {
  res.render('users/user-profile.hbs');
});

module.exports = router;