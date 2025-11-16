import { getPersonBySlug, getPublicOfficesByPerson, getActivitiesByPerson, Activity, PublicOffice } from '@/lib/directus';
import PublicOfficeCard from '@/components/PublicOfficeCard';
import GradientHeader from '@/components/GradientHeader';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import PersonBiography from '@/components/PersonBiography';
import ActivityCard from '@/components/ActivityCard';

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
  const activities = await getActivitiesByPerson(person.id);

  type TimelineItem =
    | { kind: 'office'; item: PublicOffice }
    | { kind: 'activity'; item: Activity };

  const timeline: TimelineItem[] = [
    ...offices.map((o) => ({ kind: 'office', item: o as PublicOffice })),
    ...activities.map((a) => ({ kind: 'activity', item: a as Activity })),
  ].sort((a, b) => {
    const getStart = (x: TimelineItem) =>
      x.kind === 'office' ? x.item.start_date : x.item.start_date;
    const getEnd = (x: TimelineItem) =>
      x.kind === 'office' ? x.item.end_date : x.item.end_date;

    const dateA = getStart(a) ? new Date(getStart(a) as string).getTime() : 0;
    const dateB = getStart(b) ? new Date(getStart(b) as string).getTime() : 0;

    if (dateA !== dateB) return dateA - dateB;

    const endA = getEnd(a) ? new Date(getEnd(a) as string).getTime() : Infinity;
    const endB = getEnd(b) ? new Date(getEnd(b) as string).getTime() : Infinity;
    return endA - endB;
  });

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
                    unoptimized
                  />
                </div>
              </div>
            )}

            {/* Садржај */}
            <div className="flex-1 md:order-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {person.full_name}
              </h1>

              {/* Биографија - до ~20 редова, са ...више / ...мање */}
              <PersonBiography biography={person.biography} />

              {/* Source - испод биографије */}
              {person.source && person.source.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-3">
                    <span className="font-semibold">Извор:</span>{' '}
                    {person.source.map((src, idx) => (
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
                        {idx < person.source!.length - 1 && ', '}
                      </span>
                    ))}
                  </p>

                  {/* Области као беџеви у дну биографске картице */}
                  {person.area && person.area.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {person.area.map((area) => (
                        <span
                          key={area.id}
                          className="px-3 py-1 text-xs md:text-sm rounded-full bg-red-50 text-red-800 border border-red-100"
                        >
                          {area.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Функције и активности */}
      {timeline.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Функције и активности
          </h2>
          {timeline.map((entry) =>
            entry.kind === 'office' ? (
              <PublicOfficeCard key={`office-${entry.item.id}`} office={entry.item} />
            ) : (
              <ActivityCard key={`activity-${entry.item.id}`} activity={entry.item} />
            )
          )}
        </div>
      )}
        </div>
      </div>
    </div>
  );
}

