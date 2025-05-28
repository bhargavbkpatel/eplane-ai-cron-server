export class CustomError extends Error {
  public statusCode: number;
  public extraData?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode = 500,
    extraData?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.extraData = extraData;
    Error.captureStackTrace(this, this.constructor);
  }
}
