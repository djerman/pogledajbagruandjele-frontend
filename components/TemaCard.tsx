'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Tema } from '@/lib/directus';
import ExpandableHtml from './ExpandableHtml';

interface TemaCardProps {
  tema: Tema;
}

export default function TemaCard({ tema }: TemaCardProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  const getImageUrl = (imageId: string) => {
    if (!imageId) return '';
    if (imageId.startsWith('http')) {
      return imageId;
    }
    // Користимо NEXT_PUBLIC_DIRECTUS_URL са fallback-ом
    const baseUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://185.229.119.44:8155';
    return `${baseUrl}/assets/${imageId}`;
  };

  // Затварање lightbox-а на Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxUrl(null);
      }
    };
    if (lightboxUrl) {
      window.addEventListener('keydown', handler);
    }
    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, [lightboxUrl]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Н/Д';
    const date = new Date(dateString);
    return date.toLocaleDateString('sr-RS', {
      year: 'numeric',
      month: 'long',
    });
  };

  const sources = tema.sources || [];

  return (
    <div className="bg-white rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] mb-6 border-4 border-red-600 overflow-hidden">
      {/* Градијент header */}
      <div className="bg-gradient-to-b from-red-900 via-red-800 to-black text-white px-8 py-6">
        <h2 className="text-3xl font-bold">
          {tema.name}
        </h2>
      </div>

      {/* Бела позадина за остатак садржаја */}
      <div className="p-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Слика - на мобилним изнад, на десктопу десно */}
          {tema.images && tema.images.length > 0 && (
            <div className="flex-shrink-0 md:order-2 flex flex-col gap-3">
              {tema.images.slice(0, 3).map((imgId, idx) => {
                const url = getImageUrl(imgId);
                if (!url) return null;
                return (
                  <button
                    key={idx}
                    type="button"
                    className="relative w-full md:w-48 h-48 rounded-lg overflow-hidden focus:outline-none cursor-zoom-in"
                    onClick={() => setLightboxUrl(url)}
                  >
                    <Image
                      src={url}
                      alt={`${tema.name} - слика ${idx + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </button>
                );
              })}
            </div>
          )}

          {/* Садржај */}
          <div className="flex-1 md:order-1">
            {/* Опис */}
            {tema.description && (
              <div className="mb-4">
                <ExpandableHtml html={tema.description} maxLength={900} />
              </div>
            )}

            {/* Извор и датуми у дну картице */}
            {(sources.length > 0 || tema.date_from || tema.date_to) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                {/* Извор */}
                {sources.length > 0 && (
                  <p className="text-sm text-gray-600 mb-3">
                    <span className="font-semibold">Извор:</span>{' '}
                    {sources.map((src, idx) => (
                      <span key={src.id || idx}>
                        {src.url ? (
                          <button
                            type="button"
                            className="text-red-600 hover:underline"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              window.open(src.url!, '_blank', 'noopener,noreferrer');
                            }}
                          >
                            {src.naziv || src.url}
                          </button>
                        ) : (
                          src.naziv
                        )}
                        {idx < sources.length - 1 && ', '}
                      </span>
                    ))}
                  </p>
                )}

                {/* Датуми као беџеви */}
                {(tema.date_from || tema.date_to) && (
                  <div className="flex flex-wrap gap-2">
                    {tema.date_from && (
                      <span className="px-3 py-1 text-xs md:text-sm rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                        {`Почетак: ${formatDate(tema.date_from)}`}
                      </span>
                    )}
                    {tema.date_to && (
                      <span className="px-3 py-1 text-xs md:text-sm rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                        {`Крај: ${formatDate(tema.date_to)}`}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox за увећање слике */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setLightboxUrl(null)}
        >
          <div
            className="max-w-5xl max-h-[90vh] w-full flex items-center justify-center px-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* За lightbox користимо обичан <img> да избегнемо ограничења Next Image */}
            <img
              src={lightboxUrl}
              alt={tema.name}
              className={`max-h-[90vh] w-auto max-w-full rounded-lg shadow-lg object-contain transition-transform duration-200 ${
                isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'
              }`}
              onClick={() => setIsZoomed((prev) => !prev)}
            />
            <button
              type="button"
              className="absolute top-4 right-4 text-white text-2xl font-bold"
              onClick={() => {
                setIsZoomed(false);
                setLightboxUrl(null);
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

