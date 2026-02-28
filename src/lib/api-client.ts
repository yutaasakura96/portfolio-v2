const BASE_URL = "/api";

type ApiErrorShape = {
  status: number;
  message: string;
  code: string;
  details?: unknown;
};

type ApiResponse<T> = {
  data: T;
};

type ApiListResponse<T, M = unknown> = {
  data: T[];
  meta: M;
};

type QueryParams = Record<string, string>;

class ApiClient {
  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // Attempt token refresh
      const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
      });

      if (refreshResponse.ok) {
        // Retry original request
        const retryResponse = await fetch(`${BASE_URL}${path}`, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            ...options.headers,
          },
        });
        if (!retryResponse.ok) throw await this.parseError(retryResponse);
        if (retryResponse.status === 204) return undefined as T;
        return retryResponse.json();
      }

      // Refresh failed — redirect to login (skip if already there to avoid reload loop)
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/admin/login")) {
        window.location.href = "/admin/login";
      }
      throw new Error("Session expired");
    }

    if (!response.ok) {
      throw await this.parseError(response);
    }

    if (response.status === 204) return undefined as T;
    return response.json();
  }

  private async parseError(response: Response): Promise<ApiErrorShape> {
    try {
      const body = (await response.json()) as { error?: Partial<ApiErrorShape> };
      return {
        status: response.status,
        message: body.error?.message ?? "An error occurred",
        code: body.error?.code ?? "UNKNOWN",
        ...(body.error?.details ? { details: body.error.details } : {}),
      };
    } catch {
      return { status: response.status, message: "An error occurred", code: "UNKNOWN" };
    }
  }

  // ── Auth ──────────────────────────────────────────
  getMe() {
    return this.request<ApiResponse<{ email: string; sub: string }>>("/auth/me");
  }

  signOut() {
    return this.request<ApiResponse<{ success: boolean }>>("/auth/signout", {
      method: "POST",
    });
  }

  // ── Hero ──────────────────────────────────────────
  getHero<T = unknown>() {
    return this.request<ApiResponse<T>>("/hero");
  }

  updateHero<TInput extends Record<string, unknown>, TOutput = unknown>(data: TInput) {
    return this.request<ApiResponse<TOutput>>("/hero", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // ── Projects ──────────────────────────────────────
  getProjects<T = unknown, M = unknown>(params?: QueryParams) {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request<ApiListResponse<T, M>>(`/projects${query}`);
  }

  getProject<T = unknown>(id: string) {
    return this.request<ApiResponse<T>>(`/projects/${id}`);
  }

  createProject<TInput extends Record<string, unknown>, TOutput = unknown>(data: TInput) {
    return this.request<ApiResponse<TOutput>>("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateProject<TInput extends Record<string, unknown>, TOutput = unknown>(
    id: string,
    data: TInput
  ) {
    return this.request<ApiResponse<TOutput>>(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  deleteProject(id: string) {
    return this.request<void>(`/projects/${id}`, { method: "DELETE" });
  }

  reorderProjects<TOutput = unknown>(orderedIds: string[]) {
    return this.request<ApiResponse<TOutput>>("/projects/reorder", {
      method: "PUT",
      body: JSON.stringify({ orderedIds }),
    });
  }

  // ── Skills ────────────────────────────────────────
  getSkills<T = unknown, M = unknown>(params?: QueryParams) {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request<ApiListResponse<T, M>>(`/skills${query}`);
  }

  createSkill<TInput extends Record<string, unknown>, TOutput = unknown>(data: TInput) {
    return this.request<ApiResponse<TOutput>>("/skills", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateSkill<TInput extends Record<string, unknown>, TOutput = unknown>(id: string, data: TInput) {
    return this.request<ApiResponse<TOutput>>(`/skills/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  deleteSkill(id: string) {
    return this.request<void>(`/skills/${id}`, { method: "DELETE" });
  }

  reorderSkills<TOutput = unknown>(orderedIds: string[]) {
    return this.request<ApiResponse<TOutput>>("/skills/reorder", {
      method: "PUT",
      body: JSON.stringify({ orderedIds }),
    });
  }

  // ── Experience ────────────────────────────────────
  getExperience<T = unknown, M = unknown>(params?: QueryParams) {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request<ApiListResponse<T, M>>(`/experience${query}`);
  }

  createExperience<TInput extends Record<string, unknown>, TOutput = unknown>(data: TInput) {
    return this.request<ApiResponse<TOutput>>("/experience", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateExperience<TInput extends Record<string, unknown>, TOutput = unknown>(
    id: string,
    data: TInput
  ) {
    return this.request<ApiResponse<TOutput>>(`/experience/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  deleteExperience(id: string) {
    return this.request<void>(`/experience/${id}`, { method: "DELETE" });
  }

  reorderExperience<TOutput = unknown>(orderedIds: string[]) {
    return this.request<ApiResponse<TOutput>>("/experience/reorder", {
      method: "PUT",
      body: JSON.stringify({ orderedIds }),
    });
  }

  // ── Education ─────────────────────────────────────
  getEducation<T = unknown, M = unknown>(params?: QueryParams) {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request<ApiListResponse<T, M>>(`/education${query}`);
  }

  createEducation<TInput extends Record<string, unknown>, TOutput = unknown>(data: TInput) {
    return this.request<ApiResponse<TOutput>>("/education", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateEducation<TInput extends Record<string, unknown>, TOutput = unknown>(
    id: string,
    data: TInput
  ) {
    return this.request<ApiResponse<TOutput>>(`/education/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  deleteEducation(id: string) {
    return this.request<void>(`/education/${id}`, { method: "DELETE" });
  }

  reorderEducation<TOutput = unknown>(orderedIds: string[]) {
    return this.request<ApiResponse<TOutput>>("/education/reorder", {
      method: "PUT",
      body: JSON.stringify({ orderedIds }),
    });
  }

  // ── Certifications ────────────────────────────────
  getCertifications<T = unknown, M = unknown>(params?: QueryParams) {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request<ApiListResponse<T, M>>(`/certifications${query}`);
  }

  createCertification<TInput extends Record<string, unknown>, TOutput = unknown>(data: TInput) {
    return this.request<ApiResponse<TOutput>>("/certifications", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateCertification<TInput extends Record<string, unknown>, TOutput = unknown>(
    id: string,
    data: TInput
  ) {
    return this.request<ApiResponse<TOutput>>(`/certifications/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  deleteCertification(id: string) {
    return this.request<void>(`/certifications/${id}`, { method: "DELETE" });
  }

  reorderCertifications<TOutput = unknown>(orderedIds: string[]) {
    return this.request<ApiResponse<TOutput>>("/certifications/reorder", {
      method: "PUT",
      body: JSON.stringify({ orderedIds }),
    });
  }

  // ── Blog ──────────────────────────────────────────
  getBlogPosts<T = unknown, M = unknown>(params?: QueryParams) {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request<ApiListResponse<T, M>>(`/blog${query}`);
  }

  getBlogPost<T = unknown>(id: string) {
    return this.request<ApiResponse<T>>(`/blog/${id}`);
  }

  createBlogPost<TInput extends Record<string, unknown>, TOutput = unknown>(data: TInput) {
    return this.request<ApiResponse<TOutput>>("/blog", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateBlogPost<TInput extends Record<string, unknown>, TOutput = unknown>(
    id: string,
    data: TInput
  ) {
    return this.request<ApiResponse<TOutput>>(`/blog/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  deleteBlogPost(id: string) {
    return this.request<void>(`/blog/${id}`, { method: "DELETE" });
  }

  // ── Messages ───────────────────────────────────────
  getMessages<T = unknown, M = unknown>(params?: QueryParams) {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request<ApiListResponse<T, M>>(`/messages${query}`);
  }

  getMessage<T = unknown>(id: string) {
    return this.request<ApiResponse<T>>(`/messages/${id}`);
  }

  updateMessage<TInput extends Record<string, unknown>, TOutput = unknown>(
    id: string,
    data: TInput
  ) {
    return this.request<ApiResponse<TOutput>>(`/messages/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  deleteMessage(id: string) {
    return this.request<void>(`/messages/${id}`, { method: "DELETE" });
  }

  bulkUpdateMessages<TInput extends Record<string, unknown>, TOutput = unknown>(data: TInput) {
    return this.request<ApiResponse<TOutput>>("/messages/bulk", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();
