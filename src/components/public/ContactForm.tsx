"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  contactMessageSchema,
  type ContactMessageInput,
} from "@/lib/validations/contact";
import { Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

type FormStatus = "idle" | "submitting" | "success" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactMessageInput>({
    resolver: zodResolver(contactMessageSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
      honeypot: "",
    },
  });

  const onSubmit = async (data: ContactMessageInput) => {
    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.status === 429) {
        setStatus("error");
        setErrorMessage(
          "Too many messages sent. Please try again in a few minutes."
        );
        return;
      }

      if (!response.ok) {
        const body = await response.json();
        setStatus("error");
        setErrorMessage(body.error?.message || "Something went wrong.");
        return;
      }

      setStatus("success");
      reset();
    } catch {
      setStatus("error");
      setErrorMessage(
        "Network error. Please check your connection and try again."
      );
    }
  };

  // ── Success State ──────────────────────────────────
  if (status === "success") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
        <h3 className="mt-4 text-lg font-semibold text-green-900">
          Message sent!
        </h3>
        <p className="mt-2 text-sm text-green-700">
          Thank you for reaching out. I&apos;ll get back to you as soon as
          possible.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-6 text-sm font-medium text-green-700 underline hover:text-green-900"
        >
          Send another message
        </button>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* Honeypot — hidden from users, visible to bots */}
      <div
        className="absolute -left-[9999px] -top-[9999px]"
        aria-hidden="true"
      >
        <label htmlFor="honeypot">
          Do not fill this out
          <input
            id="honeypot"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            {...register("honeypot")}
          />
        </label>
      </div>

      {/* Error Banner */}
      {status === "error" && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          {...register("name")}
          className={`mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900/10 ${
            errors.name
              ? "border-red-300 focus:border-red-500"
              : "border-gray-300 focus:border-gray-900"
          }`}
          placeholder="Your name"
          disabled={status === "submitting"}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          Email <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          type="email"
          {...register("email")}
          className={`mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900/10 ${
            errors.email
              ? "border-red-300 focus:border-red-500"
              : "border-gray-300 focus:border-gray-900"
          }`}
          placeholder="your@email.com"
          disabled={status === "submitting"}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Subject */}
      <div>
        <label
          htmlFor="subject"
          className="block text-sm font-medium text-gray-700"
        >
          Subject
        </label>
        <input
          id="subject"
          type="text"
          {...register("subject")}
          className={`mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900/10 ${
            errors.subject
              ? "border-red-300 focus:border-red-500"
              : "border-gray-300 focus:border-gray-900"
          }`}
          placeholder="What is this about?"
          disabled={status === "submitting"}
        />
        {errors.subject && (
          <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
        )}
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-gray-700"
        >
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          rows={6}
          {...register("message")}
          className={`mt-1 block w-full resize-y rounded-lg border px-4 py-2.5 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900/10 ${
            errors.message
              ? "border-red-300 focus:border-red-500"
              : "border-gray-300 focus:border-gray-900"
          }`}
          placeholder="Your message (at least 10 characters)"
          disabled={status === "submitting"}
        />
        {errors.message && (
          <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Send Message
          </>
        )}
      </button>
    </form>
  );
}
