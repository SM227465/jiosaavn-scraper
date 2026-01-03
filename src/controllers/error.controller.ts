import { NextFunction, Request, Response } from 'express';

// const handleDbValidationError = (error: Error.ValidationError, res: Response) => {
//   const errors = Object.values(error.errors).map((el) => ({
//     field: el.path,
//     message: el.message,
//   }));

//   return res.status(400).json({
//     success: false,
//     message: error?.message?.split(':')?.[0] || 'Something went wrong!',
//     errors: errors,
//   });
// };

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500;

  let error = err;
  // if (error.code === 11000) error = handleDuplicateFieldsDB(error);

  if (err?.['name'] === 'CastError') {
    const message = `Invalid ${error?.['path']} : ${error?.['value']}`;

    return res.status(400).json({ success: false, message });
//   } else if (error instanceof JsonWebTokenError) {
//     return res.status(401).json({
//       success: false,
//       message: 'Invalid token! Please login again',
//     });
//   } else if (error instanceof TokenExpiredError) {
//     return res.status(401).json({
//       success: false,
//       message: 'Token has expired! Please login again',
//     });
//   } else if (error instanceof Error.ValidationError) {
//     handleDbValidationError(error, res);
  } else {
    return res.status(err.statusCode).json({
      success: err.success,
      message: err.message,
    });
  }
};

export default errorHandler;
