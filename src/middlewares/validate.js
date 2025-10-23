const { ErrorResponse } = require('../utils/error-schema');

exports.validateUuidParam =
  (param = 'id') =>
  (req, res, next) => {
    const v = req.params[param];
    const ok = /^[0-9a-fA-F-]{36}$/.test(v);
    if (!ok)
      return res
        .status(400)
        .json(
          new ErrorResponse(`Le paramètre ${param} doit être un UUID valide.`)
        );
    next();
  };

exports.parsePagination = (req, res, next) => {
  req.query.limit = Math.min(parseInt(req.query.limit ?? '10', 10), 100);
  req.query.offset = Math.max(parseInt(req.query.offset ?? '0', 10), 0);
  next();
};
