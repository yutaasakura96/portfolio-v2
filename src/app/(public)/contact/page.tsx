import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with me for collaborations, projects, or just to say hello.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Contact</h1>
      <p className="mt-4 text-gray-600">
        Contact form coming soon. In the meantime, feel free to reach out via{" "}
        <a href="mailto:your@email.com" className="text-gray-900 font-medium underline">
          email
        </a>
        .
      </p>
    </div>
  );
}
