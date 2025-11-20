import { sign } from 'hono/jwt';
import { env } from '@/shared/configs/environment';
import { parseJwtExpiresIn } from '@/shared/utils/parse-jwt-expires-in';

/**
 * Define the type for payload that will be included in the token.
 */
export type TokenPayload = {
  sub: number;
  name: string;
};

/**
 * Generates access token and refresh token.
 * @param payload Data to be included in the token (sub, name).
 * @returns Object containing accessToken.
 */
export const generateTokens = async (payload: TokenPayload) => {
  const accessToken = await sign(
    {
      ...payload,
      exp:
        Math.floor(Date.now() / 1000) + parseJwtExpiresIn(env.JWT_EXPIRES_IN),
    },
    env.JWT_SECRET
  );

  return { accessToken };
};