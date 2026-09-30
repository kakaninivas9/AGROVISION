const errorHandler = (err, req, res, next) => {
  console.error(`[Global Error] ${err.name}: ${err.message}`);
  
  // Mongoose Bad ObjectId
  if (err.name === 'CastError') {
    return res.status(404).json({ error: 'Resource not found' });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    return res.status(409).json({ error: 'Duplicate field value entered' });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    return res.status(400).json({ error: message });
  }

  res.status(err.statusCode || 500).json({
    error: err.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
