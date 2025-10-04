const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Default error
  let error = {
    message: err.message || "Internal Server Error",
    status: err.status || 500,
  };

  // Sequelize validation error
  if (err.name === "SequelizeValidationError") {
    error.message = err.errors.map((e) => e.message).join(", ");
    error.status = 400;
  }

  // Sequelize unique constraint error
  if (err.name === "SequelizeUniqueConstraintError") {
    error.message = "Resource already exists";
    error.status = 409;
  }

  // Sequelize foreign key constraint error
  if (err.name === "SequelizeForeignKeyConstraintError") {
    error.message = "Referenced resource not found";
    error.status = 400;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    error.message = "Invalid token";
    error.status = 401;
  }

  if (err.name === "TokenExpiredError") {
    error.message = "Token expired";
    error.status = 401;
  }

  // Cast error (invalid ObjectId)
  if (err.name === "CastError") {
    error.message = "Invalid resource ID";
    error.status = 400;
  }

  // File upload error
  if (err.code === "LIMIT_FILE_SIZE") {
    error.message = "File too large";
    error.status = 400;
  }

  // Network/connection errors
  if (err.code === "ECONNREFUSED") {
    error.message = "Service unavailable";
    error.status = 503;
  }

  // Rate limit error
  if (err.status === 429) {
    error.message = "Too many requests, please try again later";
    error.status = 429;
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === "production" && error.status === 500) {
    error.message = "Internal Server Error";
  }

  res.status(error.status).json({
    success: false,
    error: error.message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      details: err,
    }),
  });
};

module.exports = errorHandler;
