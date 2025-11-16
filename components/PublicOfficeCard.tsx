import Image from 'next/image';
import { PublicOffice } from '@/lib/directus';
import ExpandableHtml from './ExpandableHtml';

interface PublicOfficeCardProps {
  office: PublicOffice;
}

export default function PublicOfficeCard({ office }: PublicOfficeCardProps) {
  const getImageUrl = (imagePath: string) => {
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    return `${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${imagePath}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Н/Д';
    const date = new Date(dateString);
    // Назив месеца и година, нпр. "новембар 2025."
    return date.toLocaleDateString('sr-RS', {
      year: 'numeric',
      month: 'long',
    });
  };

  const getLevelName = (level: string) => {
    const levels: Record<string, string> = {
      local: 'Локална',
      province: 'Покрајинска',
      state: 'Државна',
    };
    return levels[level] || level;
  };

  return (
    <div className="bg-white rounded-lg shadow-md border-l-4 border-red-600 p-6 mb-6">
      {/* Назив */}
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        {office.title}
      </h3>

      {/* Body / опис - текст испод назива (HTML из Directus-а, до ~20 редова) */}
      <ExpandableHtml
        html={
          office.body && office.description
            ? `${office.body}<br/><br/>${office.description}`
            : office.body || office.description || undefined
        }
        maxLength={1000}
      />

      {/* Images */}
      {office.images && office.images.length > 0 && (
        <div className="mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {office.images.map((img, idx) => (
              <div key={idx} className="relative w-full h-48 rounded-lg overflow-hidden">
                <Image
                  src={getImageUrl(img)}
                  alt={`${office.title} - слика ${idx + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video */}
      {office.video && (
        <div className="mb-4">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full rounded-lg"
              src={office.video}
              title={office.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Source - испод images/video, пре детаља */}
      {(() => {
        const sources = office.source || office.sources || [];
        return sources.length > 0 ? (
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
        ) : null;
      })()}

      {/* Детаљи као беџеви у доњем делу */}
      <div className="mt-2 flex flex-wrap gap-2 text-xs md:text-sm text-gray-700">
        {office.start_date && (
          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
            {`Почетак: ${formatDate(office.start_date)}`}
          </span>
        )}
        {office.end_date && (
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
            {`Крај: ${formatDate(office.end_date)}`}
          </span>
        )}
        {office.level && (
          <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
            {`Ниво: ${getLevelName(office.level)}`}
          </span>
        )}
        {office.place && (
          <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 border border-green-200">
            {`Место: ${
              typeof office.place === 'object' && office.place !== null
                ? office.place.naziv || office.place.name || office.place.id
                : office.place
            }`}
          </span>
        )}
        {office.province && (
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            {`Покрајина: ${office.province}`}
          </span>
        )}
        {office.institucija && (
          <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
            {`Институција: ${office.institucija}`}
          </span>
        )}
        {office.appointed_or_elected && (
          <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
            {`Начин именовања: ${office.appointed_or_elected}`}
          </span>
        )}
      </div>
    </div>
  );
}

