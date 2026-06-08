const BASE_URL = process.env.PORTFOLIO_BASE_URL ?? "http://localhost:3000";
const API_KEY = process.env.PORTFOLIO_API_KEY;

if (!API_KEY) {
  throw new Error(
    "PORTFOLIO_API_KEY is not set. Run `npm run mcp:setup` to generate a key, " +
      "then add it to your .env file."
  );
}

const authHeaders = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${API_KEY}`,
};

async function handleResponse<T>(res: Response, path: string): Promise<T> {
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { error?: { message?: string } };
      if (body?.error?.message) message = body.error.message;
    } catch {
      // ignore parse failure
    }
    throw new Error(`${res.status} ${path}: ${message}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function apiGet<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  const url = new URL(path, BASE_URL);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString(), { headers: authHeaders });
  return handleResponse<T>(res, path);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(new URL(path, BASE_URL).toString(), {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res, path);
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(new URL(path, BASE_URL).toString(), {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res, path);
}

export async function apiDelete(path: string): Promise<void> {
  const res = await fetch(new URL(path, BASE_URL).toString(), {
    method: "DELETE",
    headers: authHeaders,
  });
  await handleResponse<void>(res, path);
}
