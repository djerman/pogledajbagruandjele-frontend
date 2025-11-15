import { getPersonBySlug, getPublicOfficesByPerson } from '@/lib/directus';
import PersonCard from '@/components/PersonCard';
import PublicOfficeCard from '@/components/PublicOfficeCard';
import GradientHeader from '@/components/GradientHeader';
import { notFound } from 'next/navigation';
import Image from 'next/image';

export default async function PersonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const person = await getPersonBySlug(slug);

  if (!person) {
    notFound();
  }

  const offices = await getPublicOfficesByPerson(person.id);

  const imageUrl = person.person_image 
    ? person.person_image.startsWith('http')
      ? person.person_image
      : `${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${person.person_image}`
    : null;

  return (
    <div className="min-h-screen">
      {/* Горњи део са градијентом - црвена до црна */}
      <GradientHeader />

      {/* Бела позадина за остатак садржаја */}
      <div className="bg-white">
        <div className="container mx-auto px-4 py-8">
      {/* Биографија картица - исти изглед као на почетној */}
      <div className="mb-12">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Слика */}
            {imageUrl && (
              <div className="flex-shrink-0 md:order-2">
                <div className="relative w-full md:w-48 h-48 md:h-48 rounded-lg overflow-hidden">
                  <Image
                    src={imageUrl}
                    alt={person.full_name}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}

            {/* Садржај */}
            <div className="flex-1 md:order-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {person.full_name}
              </h1>

              {/* Области */}
              {person.area && person.area.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {person.area.map((area) => (
                    <span
                      key={area.id}
                      className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-full"
                    >
                      {area.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Биографија */}
              {person.biography && (
                <div className="mb-4">
                  <div 
                    className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: person.biography }}
                  />
                </div>
              )}

              {/* Source - испод биографије */}
              {person.source && person.source.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Извор:</span>{' '}
                    {person.source.map((src, idx) => (
                      <span key={src.id}>
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
                        {idx < person.source!.length - 1 && ', '}
                      </span>
                    ))}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Функције и активности */}
      {offices.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Функције и активности
          </h2>
          {offices.map((office) => (
            <PublicOfficeCard key={office.id} office={office} />
          ))}
        </div>
      )}
        </div>
      </div>
    </div>
  );
}

