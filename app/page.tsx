import { getPersons, getAreas } from '@/lib/directus';
import PersonCard from '@/components/PersonCard';
import YouTubeVideo from '@/components/YouTubeVideo';
import Filters from '@/components/Filters';
import GradientHeader from '@/components/GradientHeader';
import Link from 'next/link';

const YOUTUBE_VIDEO_ID = process.env.NEXT_PUBLIC_YOUTUBE_VIDEO_ID;
const YOUTUBE_VIDEO_URL = process.env.NEXT_PUBLIC_YOUTUBE_VIDEO_URL;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ 
    page?: string;
    search?: string;
    place?: string;
    area?: string;
    level?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = parseInt(resolvedSearchParams.page || '1', 10);
  const limit = 10;
  const offset = (page - 1) * limit;

  const areas = await getAreas();
  const { data: persons, total } = await getPersons(
    limit, 
    offset, 
    resolvedSearchParams.area,
    resolvedSearchParams.search,
    resolvedSearchParams.place,
    resolvedSearchParams.level
  );
  const totalPages = Math.ceil(total / limit);

  // Debug logging
  console.log('Persons fetched:', persons.length, 'Total:', total);

  return (
    <div className="min-h-screen">
      {/* Горњи део са градијентом - црвена до црна */}
      <GradientHeader />

      {/* Бела позадина за остатак садржаја */}
      <div className="bg-white">
        <div className="container mx-auto px-4 py-8">

          {/* Црвени банер */}
          <div className="bg-red-600 text-white py-4 px-6 rounded-lg mb-8 text-center">
            <p className="text-lg font-semibold">
              Погледајте: Како је Србија све дала и предала
            </p>
          </div>

          {/* YouTube видео */}
          {(YOUTUBE_VIDEO_ID || YOUTUBE_VIDEO_URL) && (
            <div className="mb-8">
              <YouTubeVideo videoId={YOUTUBE_VIDEO_ID} videoUrl={YOUTUBE_VIDEO_URL} />
            </div>
          )}

          {/* Филтери */}
          <Filters areas={areas} />

          {/* Листа личности */}
          <div className="mb-12">
            {persons.length > 0 ? (
              <>
                <div className="mb-4 text-gray-600">
                  <p>Приказано {persons.length} од {total} личности</p>
                </div>
                {persons.map((person) => (
                  <PersonCard key={person.id} person={person} />
                ))}

                {/* Пагинација */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-8">
                    {page > 1 && (
                      <Link
                        href={`/?${new URLSearchParams({
                          ...(resolvedSearchParams.search && { search: resolvedSearchParams.search }),
                          ...(resolvedSearchParams.place && { place: resolvedSearchParams.place }),
                          ...(resolvedSearchParams.area && { area: resolvedSearchParams.area }),
                          ...(resolvedSearchParams.level && { level: resolvedSearchParams.level }),
                          page: String(page - 1),
                        }).toString()}`}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Претходна
                      </Link>
                    )}
                    <span className="text-gray-600">
                      Страна {page} од {totalPages}
                    </span>
                    {page < totalPages && (
                      <Link
                        href={`/?${new URLSearchParams({
                          ...(resolvedSearchParams.search && { search: resolvedSearchParams.search }),
                          ...(resolvedSearchParams.place && { place: resolvedSearchParams.place }),
                          ...(resolvedSearchParams.area && { area: resolvedSearchParams.area }),
                          ...(resolvedSearchParams.level && { level: resolvedSearchParams.level }),
                          page: String(page + 1),
                        }).toString()}`}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Следећа
                      </Link>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">
                  Нема доступних личности.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Проверите конзолу за детаље о дохватању података.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
