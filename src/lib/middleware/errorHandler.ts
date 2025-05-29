import { NextFunction, Request, Response } from "express";
import logger from "../../utils/logger/logger";

export const errorHandler = (
  err: Error & { statusCode?: number; extraData?: Record<string, unknown> },
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error("Error occurred", {
    message: err.message,
    stack: err.stack,
    extraData: err.extraData || {},
    path: req.path,
    method: req.method,
  });

  res.status(err.statusCode || 500).json({
    error: err.message || "Internal Server Error",
  });
};
