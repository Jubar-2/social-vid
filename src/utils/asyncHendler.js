const asyncHendler = (asyncHendler) => (req, res, next) => {
  Promise.resolve(asyncHendler(req, res, next)).catch((err) => next(err));
}

export default asyncHendler;