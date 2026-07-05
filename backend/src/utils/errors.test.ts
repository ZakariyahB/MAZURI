import { describe, expect, it } from 'vitest';
import {
  AppError,
  badRequest,
  conflict,
  forbidden,
  notFound,
  paymentRequired,
  unauthorized,
} from './errors';

describe('AppError', () => {
  it('carries a status code and message', () => {
    const err = new AppError(418, "I'm a teapot");
    expect(err).toBeInstanceOf(Error);
    expect(err.statusCode).toBe(418);
    expect(err.message).toBe("I'm a teapot");
    expect(err.name).toBe('AppError');
  });
});

describe('error factories', () => {
  it('map to the correct HTTP status codes', () => {
    expect(badRequest().statusCode).toBe(400);
    expect(unauthorized().statusCode).toBe(401);
    expect(paymentRequired().statusCode).toBe(402);
    expect(forbidden().statusCode).toBe(403);
    expect(notFound().statusCode).toBe(404);
    expect(conflict().statusCode).toBe(409);
  });

  it('use sensible default messages', () => {
    expect(badRequest().message).toBe('Bad Request');
    expect(unauthorized().message).toBe('Unauthorized');
    expect(paymentRequired().message).toBe('Payment Required');
    expect(forbidden().message).toBe('Forbidden');
    expect(notFound().message).toBe('Not Found');
    expect(conflict().message).toBe('Conflict');
  });

  it('accept a custom message', () => {
    const err = notFound('community not found');
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('community not found');
  });

  it('produce AppError instances', () => {
    expect(badRequest()).toBeInstanceOf(AppError);
  });
});
