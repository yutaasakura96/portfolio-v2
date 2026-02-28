import { Metadata } from "next";
import { ContactForm } from "@/components/public/ContactForm";
import { Mail, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with me for collaborations, projects, or just to say hello.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Get in Touch</h1>
        <p className="mt-3 text-gray-600">
          Have a question, project idea, or just want to say hello? Fill out the
          form below and I&apos;ll get back to you as soon as possible.
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-3">
        {/* Form — takes 2/3 width on large screens */}
        <div className="lg:col-span-2">
          <ContactForm />
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Other Ways to Reach Me
            </h3>
            <div className="mt-4 space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Email</p>
                  <a
                    href="mailto:your@email.com"
                    className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    your@email.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Location</p>
                  <p className="text-sm text-gray-500">Japan</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Response Time
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              I typically respond within 1–2 business days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
