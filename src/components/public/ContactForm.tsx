"use client";

import { cn } from "@/lib/utils";
import { contactMessageSchema, type ContactMessageInput } from "@/lib/validations/contact";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle, Loader2, Send } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

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
        setErrorMessage("Too many messages sent. Please try again in a few minutes.");
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
      setErrorMessage("Network error. Please check your connection and try again.");
    }
  };

  // ── Success State ──────────────────────────────────
  if (status === "success") {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-10 text-center dark:border-green-900 dark:bg-green-950">
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 dark:bg-green-900 mb-4"
          style={{
            animation: "staggerIn 500ms var(--ease-bounce) forwards",
          }}
        >
          <CheckCircle className="h-7 w-7 text-green-500" />
        </div>
        <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">Message sent!</h3>
        <p className="mt-2 text-sm text-green-700 dark:text-green-300">
          Thank you for reaching out. I&apos;ll get back to you as soon as possible.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="pressable mt-6 text-sm font-medium text-green-700 underline hover:text-green-900 dark:text-green-300 dark:hover:text-green-100"
        >
          Send another message
        </button>
      </div>
    );
  }

  const inputBase =
    "mt-1.5 block w-full rounded-lg border bg-background px-4 py-2.5 text-sm text-foreground transition-[border-color,box-shadow] duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent-signature)]/30 focus:border-[var(--accent-signature)]";

  // ── Form ───────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* Honeypot — hidden from users, visible to bots */}
      <div className="absolute -left-[9999px] -top-[9999px]" aria-hidden="true">
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
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <p className="text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground">
            Name <span className="text-[var(--accent-signature)]">*</span>
          </label>
          <input
            id="name"
            type="text"
            {...register("name")}
            className={cn(inputBase, errors.name ? "border-destructive/50" : "border-input")}
            placeholder="Your name"
            disabled={status === "submitting"}
          />
          {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground">
            Email <span className="text-[var(--accent-signature)]">*</span>
          </label>
          <input
            id="email"
            type="email"
            {...register("email")}
            className={cn(inputBase, errors.email ? "border-destructive/50" : "border-input")}
            placeholder="your@email.com"
            disabled={status === "submitting"}
          />
          {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
        </div>
      </div>

      {/* Subject */}
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-foreground">
          Subject
        </label>
        <input
          id="subject"
          type="text"
          {...register("subject")}
          className={cn(inputBase, errors.subject ? "border-destructive/50" : "border-input")}
          placeholder="What is this about?"
          disabled={status === "submitting"}
        />
        {errors.subject && (
          <p className="mt-1 text-sm text-destructive">{errors.subject.message}</p>
        )}
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-foreground">
          Message <span className="text-[var(--accent-signature)]">*</span>
        </label>
        <textarea
          id="message"
          rows={5}
          {...register("message")}
          className={cn(
            inputBase,
            "resize-y",
            errors.message ? "border-destructive/50" : "border-input"
          )}
          placeholder="Your message..."
          disabled={status === "submitting"}
        />
        {errors.message && (
          <p className="mt-1 text-sm text-destructive">{errors.message.message}</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={status === "submitting"}
        className="pressable focus-signature arrow-link inline-flex items-center gap-2 rounded-lg bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="h-4 w-4 arrow-icon" />
            Send Message
          </>
        )}
      </button>
    </form>
  );
}
