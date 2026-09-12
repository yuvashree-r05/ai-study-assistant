// This is the LAST middleware in the chain — Express automatically
// routes any error that reaches here (via next(err), or any thrown
// error in an async route we forgot to catch) through this function
// instead of crashing the whole server or leaving the request hanging.
//
// Note the FOUR parameters — Express specifically recognizes an error
// handler by having (err, req, res, next), even though `next` is
// unused here. This is a real Express convention, not a style choice.

function errorHandler(err, req, res, next) {
  console.error('Unhandled error:', err.message);
  console.error(err.stack);

  res.status(500).json({
    error: 'An unexpected error occurred. Please try again.',
  });
}

module.exports = errorHandler;