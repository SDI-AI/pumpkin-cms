import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-8 text-center">
      <span className="text-6xl mb-6" role="img" aria-label="Pumpkin">
        🎃
      </span>
      <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">
        Page Not Found
      </h1>
      <p className="text-lg text-neutral-500 mt-3 max-w-md">
        This page doesn&apos;t exist yet. Maybe it&apos;s waiting to be created in the Pumpkin CMS admin.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center px-6 py-2.5 bg-pumpkin-500 text-white font-bold rounded-full hover:bg-pumpkin-600 transition-all shadow-md"
      >
        Go Home
      </Link>
    </div>
  );
}
