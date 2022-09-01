import User from '../models/model-user'

// This is middleware to make sure
// a called route checks whether there
// is a user in the session.
function isLoggedIn(request, response, next) {
  if (request.session && request.session.userId) {
    User.findById(request.session.userId).exec((error, author) => {
      if (error) {
        return next(error)
      }
      if (!author) {
        return response.redirect('/login')
      }
      return next()
    })
  } else {
    response.redirect('/login')
  }
}

module.exports.isLoggedIn = isLoggedIn
