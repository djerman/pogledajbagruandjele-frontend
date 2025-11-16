'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Activity } from '@/lib/directus';
import ExpandableHtml from './ExpandableHtml';

interface ActivityCardProps {
  activity: Activity;
}

export default function ActivityCard({ activity }: ActivityCardProps) {
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

  const sources = activity.source || activity.sources || [];

  // Debug логовање за слике
  useEffect(() => {
    if (activity.images && activity.images.length > 0) {
      console.log(`[ActivityCard] Activity "${activity.title}" has ${activity.images.length} images:`, activity.images);
      activity.images.forEach((imgId, idx) => {
        const url = getImageUrl(imgId);
        console.log(`[ActivityCard] Image ${idx + 1} ID: ${imgId}, URL: ${url}`);
      });
    } else {
      console.log(`[ActivityCard] Activity "${activity.title}" has no images`);
    }
  }, [activity.images, activity.title]);

  return (
    <div className="bg-white rounded-lg shadow-md border-l-4 border-red-600 p-6 mb-6">
      {/* Назив */}
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        {activity.title}
      </h3>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Текст левo */}
        <div className="flex-1 md:order-1">
          {/* Опис активности (HTML из Directus-а, до ~20 редова) */}
          <ExpandableHtml html={activity.description} maxLength={1000} />
        </div>

        {/* Слике десно (до 3, једна испод друге) */}
        {activity.images && activity.images.length > 0 && (
          <div className="flex-shrink-0 md:order-2 flex flex-col gap-3">
            {activity.images.slice(0, 3).map((imgId, idx) => {
              const url = getImageUrl(imgId);
              if (!url) {
                console.warn(`[ActivityCard] Empty URL for image ${idx + 1} with ID: ${imgId}`);
                return null;
              }
              return (
                <button
                  key={idx}
                  type="button"
                  className="relative w-full md:w-48 h-48 rounded-lg overflow-hidden focus:outline-none cursor-zoom-in"
                  onClick={() => setLightboxUrl(url)}
                >
                  <Image
                    src={url}
                    alt={`${activity.title} - слика ${idx + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Video */}
      {activity.video && (
        <div className="mb-4">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full rounded-lg"
              src={activity.video}
              title={activity.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Извор */}
      {sources.length > 0 && (
        <div className="mb-4 pb-4 border-b border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Извор:</span>{' '}
            {sources.map((src, idx) => (
              <span key={src.id || idx}>
                {src.url ? (
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 hover:underline"
                  >
                    {src.naziv || src.url}
                  </a>
                ) : (
                  src.naziv
                )}
                {idx < sources.length - 1 && ', '}
              </span>
            ))}
          </p>
        </div>
      )}

      {/* Детаљи као беџеви */}
      <div className="mt-2 flex flex-wrap gap-2 text-xs md:text-sm text-gray-700">
        {activity.type && (
          <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
            {activity.type}
          </span>
        )}
        {activity.start_date && (
          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
            {`Почетак: ${formatDate(activity.start_date)}`}
          </span>
        )}
        {activity.end_date && (
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
            {`Крај: ${formatDate(activity.end_date)}`}
          </span>
        )}
        {activity.place && (
          <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 border border-green-200">
            {`Место: ${
              typeof activity.place === 'object' && activity.place !== null
                ? (activity.place as any).naziv || (activity.place as any).name || (activity.place as any).id
                : activity.place
            }`}
          </span>
        )}
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
              alt={activity.title}
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


