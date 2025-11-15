'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Area } from '@/lib/directus';

interface HeaderProps {
  areas: Area[];
}

export default function Header({ areas }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loadedAreas, setLoadedAreas] = useState<Area[]>(areas);

  // Fallback листа области ако се не учитају из Directus-а
  const defaultAreas: Area[] = [
    { id: 1, name: 'Политика', slug: 'politika', status: 'published' },
    { id: 2, name: 'Привреда', slug: 'privreda', status: 'published' },
    { id: 3, name: 'Медији', slug: 'mediji', status: 'published' },
    { id: 4, name: 'Култура', slug: 'kultura', status: 'published' },
    { id: 5, name: 'Спорт', slug: 'sport', status: 'published' },
    { id: 6, name: 'Безбедност', slug: 'bezbednost', status: 'published' },
    { id: 7, name: 'Остало', slug: 'ostalo', status: 'published' },
  ];

  useEffect(() => {
    // Ако области нису учитане, користимо fallback
    if (!loadedAreas || loadedAreas.length === 0) {
      setLoadedAreas(defaultAreas);
    }
  }, [areas]);

  const displayAreas = loadedAreas && loadedAreas.length > 0 ? loadedAreas : defaultAreas;

  return (
    <header className="w-full bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between">
        {/* Лого */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logo_bagra.png"
            alt="Лого"
            width={60}
            height={24}
            className="h-auto"
            priority
          />
        </Link>

        {/* Бургер мени */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex flex-col gap-1.5 p-2 focus:outline-none"
            aria-label="Отвори мени"
          >
            <span
              className={`block h-0.5 w-6 bg-black transition-all ${
                isMenuOpen ? 'rotate-45 translate-y-2' : ''
              }`}
            />
            <span
              className={`block h-0.5 w-6 bg-black transition-all ${
                isMenuOpen ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`block h-0.5 w-6 bg-black transition-all ${
                isMenuOpen ? '-rotate-45 -translate-y-2' : ''
              }`}
            />
          </button>

          {/* Dropdown мени */}
          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="py-2">
                  {displayAreas.map((area) => (
                    <Link
                      key={area.id}
                      href={`/area/${area.slug}`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {area.name}
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

