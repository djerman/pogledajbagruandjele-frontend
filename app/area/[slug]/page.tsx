import { getAreaBySlug, getPersons } from '@/lib/directus';
import PersonCard from '@/components/PersonCard';
import GradientHeader from '@/components/GradientHeader';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function AreaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const area = await getAreaBySlug(slug);

  if (!area) {
    notFound();
  }

  const page = parseInt(resolvedSearchParams.page || '1', 10);
  const limit = 10;
  const offset = (page - 1) * limit;

  const { data: persons, total } = await getPersons(limit, offset, slug);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen">
      {/* Горњи део са градијентом - црвена до црна */}
      <GradientHeader />

      {/* Бела позадина за остатак садржаја */}
      <div className="bg-white">
        <div className="container mx-auto px-4 py-8">
      {/* Наслов области */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {area.name}
        </h1>
      </div>

      {/* Листа личности */}
      <div className="mb-12">
        {persons.length > 0 ? (
          <>
            {persons.map((person) => (
              <PersonCard key={person.id} person={person} />
            ))}

            {/* Пагинација */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                {page > 1 && (
                  <Link
                    href={`/area/${slug}?page=${page - 1}`}
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
                    href={`/area/${slug}?page=${page + 1}`}
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
              Нема доступних личности у овој области.
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

