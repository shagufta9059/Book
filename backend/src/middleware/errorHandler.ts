import type { Request, Response, NextFunction } from "express"

export function errorHandler(error: any, req: Request, res: Response, next: NextFunction) {
  console.error("Error:", error)

  const statusCode = error.statusCode || 500
  const message = error.message || "Internal server error"

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  })
}
