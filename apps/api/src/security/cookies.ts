import type { Response, CookieOptions } from 'express';

export function getSecureCookieOptions(isProduction: boolean, customOptions?: CookieOptions): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    ...customOptions,
  };
}

export function setSecureCookie(
  res: Response,
  name: string,
  value: string,
  isProduction: boolean,
  options?: CookieOptions,
): void {
  const cookieOptions = getSecureCookieOptions(isProduction, options);
  res.cookie(name, value, cookieOptions);
}

export function clearSecureCookie(
  res: Response,
  name: string,
  isProduction: boolean,
  options?: CookieOptions,
): void {
  const cookieOptions = getSecureCookieOptions(isProduction, options);
  res.clearCookie(name, cookieOptions);
}

