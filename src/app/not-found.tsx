import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-24 text-center">
      <p className="text-sm font-semibold text-gray-400">404</p>
      <h1 className="mt-2 text-3xl font-bold text-gray-900">Page not found</h1>
      <p className="mt-4 text-gray-600">
        Sorry, the page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Go Home
        </Link>
        <Link
          href="/projects"
          className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          View Projects
        </Link>
      </div>
    </div>
  );
}
