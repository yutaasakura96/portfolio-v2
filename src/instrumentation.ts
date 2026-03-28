// Next.js calls register() once at server startup, before any route or module loads.
// This is the only safe place to inject secrets before module-level initializers run
// (e.g. prismaClient.ts reads DATABASE_URL at import time).

export async function register() {
  // Only run in Node.js runtime (not Edge runtime)
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  // Local development uses .env.local — no SSM needed
  if (process.env.NODE_ENV !== 'production') return;

  const { SSMClient, GetParametersCommand } = await import('@aws-sdk/client-ssm');

  const client = new SSMClient({ region: 'ap-southeast-1' });

  let parameters;
  try {
    const result = await client.send(
      new GetParametersCommand({
        Names: ['/portfolio/prod/DATABASE_URL', '/portfolio/prod/COGNITO_CLIENT_SECRET'],
        WithDecryption: true,
      }),
    );
    parameters = result.Parameters ?? [];
  } catch (err) {
    // Non-fatal — Amplify Hosting managed SSR may not provide execution role credentials.
    // Fall back to env vars already present in the Lambda environment.
    console.warn('[instrumentation] SSM unavailable, relying on env vars:', (err as Error).message);
    return;
  }

  if (parameters.length < 2) {
    console.warn(
      `[instrumentation] Got ${parameters.length}/2 SSM params — relying on env vars for missing secrets`,
    );
  }

  for (const param of parameters) {
    if (param.Name === '/portfolio/prod/DATABASE_URL' && param.Value) {
      process.env.DATABASE_URL = param.Value;
    }
    if (param.Name === '/portfolio/prod/COGNITO_CLIENT_SECRET' && param.Value) {
      process.env.COGNITO_CLIENT_SECRET = param.Value;
    }
  }

  console.log('[instrumentation] Runtime secrets loaded from SSM Parameter Store.');
}
