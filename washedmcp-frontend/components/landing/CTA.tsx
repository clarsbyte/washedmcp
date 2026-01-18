'use client';

import Link from 'next/link';

export function CTA() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-semibold mb-8">Ready to get started?</h2>
        <Link
          href="/dashboard"
          className="inline-block px-8 py-4 bg-(--color-primary) text-white rounded-[6px]"
        >
          Get Started
        </Link>
      </div>
    </section>
  );
}
