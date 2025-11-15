import Image from 'next/image';
import { PublicOffice } from '@/lib/directus';

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
    return date.toLocaleDateString('sr-RS', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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

      {/* Body - текст испод назива */}
      {office.body && (
        <div className="mb-4">
          <div 
            className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: office.body }}
          />
        </div>
      )}

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
      {office.source && office.source.length > 0 && (
        <div className="mb-4 pb-4 border-b border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Извор:</span>{' '}
            {office.source.map((src, idx) => (
              <span key={src.id || idx}>
                {src.url ? (
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 hover:underline"
                  >
                    {src.name || src.url}
                  </a>
                ) : (
                  src.name
                )}
                {idx < office.source!.length - 1 && ', '}
              </span>
            ))}
          </p>
        </div>
      )}

      {/* Детаљи - у доњем делу */}
      <div className="space-y-2 text-sm text-gray-700">
        {office.start_date && (
          <p>
            <span className="font-semibold">Датум почетка:</span> {formatDate(office.start_date)}
          </p>
        )}
        {office.end_date && (
          <p>
            <span className="font-semibold">Датум краја:</span> {formatDate(office.end_date)}
          </p>
        )}
        {office.level && (
          <p>
            <span className="font-semibold">Ниво власти:</span> {getLevelName(office.level)}
          </p>
        )}
        {office.place && (
          <p>
            <span className="font-semibold">Место:</span> {typeof office.place === 'object' && office.place !== null ? (office.place.naziv || office.place.name || office.place.id) : office.place}
          </p>
        )}
        {office.province && (
          <p>
            <span className="font-semibold">Покрајина:</span> {office.province}
          </p>
        )}
        {office.institucija && (
          <p>
            <span className="font-semibold">Институција:</span> {office.institucija}
          </p>
        )}
        {office.appointed_or_elected && (
          <p>
            <span className="font-semibold">Начин именовања:</span> {office.appointed_or_elected}
          </p>
        )}
        {office.description && (
          <p className="mt-4 pt-4 border-t border-gray-200">
            <span className="font-semibold">Опис:</span> {office.description}
          </p>
        )}
      </div>
    </div>
  );
}

