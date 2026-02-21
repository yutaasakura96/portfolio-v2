import { createRemoteJWKSet, jwtVerify } from "jose";

export const COGNITO_CONFIG = {
  region: process.env.COGNITO_REGION!,
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
  clientId: process.env.COGNITO_CLIENT_ID!,
  clientSecret: process.env.COGNITO_CLIENT_SECRET!,
  domain: process.env.COGNITO_DOMAIN!,
};

export const COGNITO_ISSUER = `https://cognito-idp.${COGNITO_CONFIG.region}.amazonaws.com/${COGNITO_CONFIG.userPoolId}`;
export const COGNITO_JWKS_URI = `${COGNITO_ISSUER}/.well-known/jwks.json`;

// Cache the JWKS keyset — jose handles key rotation automatically
const jwks = createRemoteJWKSet(new URL(COGNITO_JWKS_URI));

/**
 * Verify a Cognito JWT (access token or ID token).
 * Returns the decoded payload or throws if invalid.
 */
export async function verifyJwt(token: string) {
  const { payload } = await jwtVerify(token, jwks, {
    issuer: COGNITO_ISSUER,
  });
  return payload;
}

/**
 * Exchange an authorization code for tokens via Cognito token endpoint.
 */
export async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const tokenEndpoint = `https://${COGNITO_CONFIG.domain}/oauth2/token`;

  // Cognito requires Basic auth for confidential clients
  const credentials = Buffer.from(
    `${COGNITO_CONFIG.clientId}:${COGNITO_CONFIG.clientSecret}`
  ).toString("base64");

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: COGNITO_CONFIG.clientId,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json() as Promise<{
    access_token: string;
    id_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  }>;
}

/**
 * Refresh an access token using a refresh token.
 */
export async function refreshAccessToken(refreshToken: string) {
  const tokenEndpoint = `https://${COGNITO_CONFIG.domain}/oauth2/token`;

  const credentials = Buffer.from(
    `${COGNITO_CONFIG.clientId}:${COGNITO_CONFIG.clientSecret}`
  ).toString("base64");

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: COGNITO_CONFIG.clientId,
    }),
  });

  if (!response.ok) {
    throw new Error("Token refresh failed");
  }

  return response.json() as Promise<{
    access_token: string;
    id_token: string;
    expires_in: number;
    token_type: string;
  }>;
}
