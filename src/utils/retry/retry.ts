export interface RetryOptions {
  retries?: number;
  initialDelay?: number;
  shouldRetry?: (error: any, attempt: number) => boolean;
  onRetry?: (
    error: any,
    attempt: number,
    delay: number
  ) => void | Promise<void>;
}

/**
 * Retries an async function with exponential backoff.
 * @param fn The async function to execute.
 * @param options Retry options.
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    retries = 3,
    initialDelay = 500,
    shouldRetry = () => true,
    onRetry = () => {},
  } = options;

  let attempt = 0;
  let lastError: any;

  while (attempt < retries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      attempt += 1;
      if (attempt >= retries || !shouldRetry(error, attempt)) {
        break;
      }
      const delay = initialDelay * Math.pow(2, attempt - 1);
      await onRetry(error, attempt, delay);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw lastError;
}
