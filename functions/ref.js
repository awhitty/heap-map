module.exports.handler = (event, context, callback) => {
  callback(null, {
    statusCode: 200,
    body: JSON.stringify({
      ref: process.env.COMMIT_REF,
    }),
  });
};
