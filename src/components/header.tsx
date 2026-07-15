"use client";

export default function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 px-8 py-4">
      <div>
        <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-gray-400 font-medium mt-0.5">{subtitle}</p>}
      </div>
    </header>
  );
}
