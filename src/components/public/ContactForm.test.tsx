import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/hooks/use-locale", () => ({
  useLocale: () => ({ locale: "en", setLocale: vi.fn() }),
}));

vi.mock("@/lib/i18n", () => ({
  ui: (_key: string) => {
    const strings: Record<string, string> = {
      name: "Name",
      yourName: "Your name",
      email: "Email",
      yourEmail: "your@email.com",
      subject: "Subject",
      subjectPlaceholder: "Subject",
      message: "Message",
      messagePlaceholder: "Your message...",
      send: "Send Message",
      sending: "Sending...",
      messageSent: "Message Sent!",
      messageSentDescription: "Thank you for reaching out.",
      sendAnother: "Send another message",
      tooManyMessages: "Too many messages. Try again later.",
      networkError: "Network error. Please try again.",
    };
    return strings[_key] ?? _key;
  },
}));

import { ContactForm } from "./ContactForm";

// ── Setup ────────────────────────────────────────────────────────────────────

const fetchMock = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ data: { message: "Sent" } }),
  });
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("ContactForm", () => {
  it("should render all form fields with labels", () => {
    render(<ContactForm />);
    expect(screen.getByLabelText(/^Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Email/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Subject/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Message/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send message/i })).toBeInTheDocument();
  });

  it("should show validation errors on empty submit", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => {
      const errors = screen
        .getAllByText(/./i)
        .filter((el) => el.classList.contains("text-destructive"));
      expect(errors.length).toBeGreaterThan(0);
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("should submit valid data and show success state", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByLabelText(/^Name/), "Jane Doe");
    await user.type(screen.getByLabelText(/^Email/), "jane@example.com");
    await user.type(screen.getByLabelText(/^Subject/), "Hello");
    await user.type(
      screen.getByLabelText(/^Message/),
      "This is a sufficiently long test message body."
    );
    await user.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => {
      expect(screen.getByText("Message Sent!")).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/contact",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );
  });

  it("should show error state on failed response", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: { message: "Server error" } }),
    });

    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByLabelText(/^Name/), "Jane Doe");
    await user.type(screen.getByLabelText(/^Email/), "jane@example.com");
    await user.type(
      screen.getByLabelText(/^Message/),
      "This is a sufficiently long test message body."
    );
    await user.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => {
      expect(screen.getByText("Server error")).toBeInTheDocument();
    });
  });

  it("should show rate limit error on 429", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: () => Promise.resolve({ error: { code: "RATE_LIMIT_EXCEEDED" } }),
    });

    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByLabelText(/^Name/), "Jane");
    await user.type(screen.getByLabelText(/^Email/), "jane@example.com");
    await user.type(
      screen.getByLabelText(/^Message/),
      "This is a sufficiently long test message body."
    );
    await user.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => {
      expect(screen.getByText(/too many messages/i)).toBeInTheDocument();
    });
  });

  it("should show network error on fetch failure", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Network error"));

    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByLabelText(/^Name/), "Jane");
    await user.type(screen.getByLabelText(/^Email/), "jane@example.com");
    await user.type(
      screen.getByLabelText(/^Message/),
      "This is a sufficiently long test message body."
    );
    await user.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });
});
