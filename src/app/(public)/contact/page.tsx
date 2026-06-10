import { LocalizedUi } from "@/components/public/LocalizedContent";
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
        <LocalizedUi
          k="contactPageTitle"
          as="h1"
          className="text-3xl font-bold text-foreground sm:text-4xl"
        />
        <LocalizedUi
          k="contactPageDescription"
          as="p"
          className="mt-3 text-muted-foreground max-w-lg"
        />
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
                <LocalizedUi k="whatToExpect" />
              </h3>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <LocalizedUi k="whatToExpectLine1" />
              </li>
              <li>
                <LocalizedUi k="whatToExpectLine2" />
              </li>
            </ul>
          </div>

          <div className="rounded-lg border border-border bg-muted p-6">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                <LocalizedUi k="responseTime" />
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              <LocalizedUi k="responseTimeDescription" />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
