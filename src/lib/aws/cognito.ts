export const COGNITO_CONFIG = {
  region: process.env.COGNITO_REGION!,
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
  clientId: process.env.COGNITO_CLIENT_ID!,
  clientSecret: process.env.COGNITO_CLIENT_SECRET!,
  domain: process.env.COGNITO_DOMAIN!,
};

export const COGNITO_ISSUER = `https://cognito-idp.${COGNITO_CONFIG.region}.amazonaws.com/${COGNITO_CONFIG.userPoolId}`;

// Cognito automatically hosts public signing keys here (no extra AWS setup required).
export const COGNITO_JWKS_URI = `${COGNITO_ISSUER}/.well-known/jwks.json`;
