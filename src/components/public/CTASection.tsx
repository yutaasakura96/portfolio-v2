import Link from "next/link";

export function CTASection() {
  return (
    <section className="py-16 bg-muted">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center">
        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
          Interested in working together?
        </h2>
        <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
          I&apos;m always open to discussing new projects, creative ideas, or opportunities to be
          part of your vision.
        </p>
        <Link
          href="/contact"
          className="mt-8 inline-flex items-center px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Get In Touch
        </Link>
      </div>
    </section>
  );
}
