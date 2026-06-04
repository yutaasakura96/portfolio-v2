import { ContactForm } from "@/components/public/ContactForm";
import { Clock, MessageSquare } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Yuta Asakura. Send a message through the contact form for project inquiries or collaboration.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <div className="mb-10">
        <p className="text-sm font-medium text-[var(--accent-signature)] mb-1">Contact</p>
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Get in Touch</h1>
        <p className="mt-3 text-muted-foreground max-w-lg">
          Have a question, project idea, or just want to say hello? Fill out the form below and
          I&apos;ll get back to you as soon as possible.
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-3">
        {/* Form — takes 2/3 width on large screens */}
        <div className="lg:col-span-2">
          <ContactForm />
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-muted p-6">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                What to Expect
              </h3>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>I&apos;ll reply to the email address you provide in the form.</li>
              <li>Project inquiries, collaborations, and general questions are all welcome.</li>
            </ul>
          </div>

          <div className="rounded-lg border border-border bg-muted p-6">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Response Time
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              I typically respond within 1–2 business days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
