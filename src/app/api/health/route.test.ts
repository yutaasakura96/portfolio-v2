// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ────────────────────────────────────────────────────────────────────

const queryRawMock = vi.fn();
vi.mock("@/lib/prisma-client", () => ({
  prisma: {
    $queryRaw: (...args: unknown[]) => queryRawMock(...args),
  },
}));

import { GET } from "./route";

function request(url: string) {
  return new NextRequest(new Request(url));
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("GET /api/health", () => {
  describe("shallow (default)", () => {
    it("should return ok without touching the database", async () => {
      const res = await GET(request("http://localhost:3000/api/health"));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.status).toBe("ok");
      expect(body.data.database).toBe("skipped");
      // The whole point: no DB wake on a plain liveness ping.
      expect(queryRawMock).not.toHaveBeenCalled();
    });

    it("should not touch the database when deep is not exactly '1'", async () => {
      for (const qs of ["?deep=0", "?deep=true", "?deep="]) {
        const res = await GET(request(`http://localhost:3000/api/health${qs}`));
        expect(res.status).toBe(200);
        expect((await res.json()).data.database).toBe("skipped");
      }
      expect(queryRawMock).not.toHaveBeenCalled();
    });
  });

  describe("deep (?deep=1)", () => {
    it("should report connected when the query succeeds", async () => {
      queryRawMock.mockResolvedValue([{ "?column?": 1 }]);

      const res = await GET(request("http://localhost:3000/api/health?deep=1"));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.data.status).toBe("ok");
      expect(body.data.database).toBe("connected");
      expect(queryRawMock).toHaveBeenCalledTimes(1);
    });

    it("should report degraded with 503 when the query fails", async () => {
      queryRawMock.mockRejectedValue(new Error("compute time quota exceeded"));

      const res = await GET(request("http://localhost:3000/api/health?deep=1"));
      const body = await res.json();

      expect(res.status).toBe(503);
      expect(body.data.status).toBe("degraded");
      expect(body.data.database).toBe("disconnected");
    });
  });
});
