'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Person } from '@/lib/directus';

interface PersonCardProps {
  person: Person;
}

export default function PersonCard({ person }: PersonCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Проверавамо да ли биографија прелази 6 редова
  const biography = person.biography || '';
  
  // Уклањамо HTML тагове за процену дужине текста
  const textOnly = biography.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  const shouldShowMore = textOnly.length > 300; // Приближно 6 редова текста
  
  // За скраћену верзију, налазимо последњи завршни таг у првих 300 карактера
  const getTruncatedHtml = (html: string, maxLength: number) => {
    if (textOnly.length <= maxLength) return html;
    
    // Налазимо позицију где треба да сече, избегавајући да сечемо унутар HTML тага
    let charCount = 0;
    let inTag = false;
    let lastGoodPosition = 0;
    
    for (let i = 0; i < html.length; i++) {
      if (html[i] === '<') {
        inTag = true;
      } else if (html[i] === '>') {
        inTag = false;
      } else if (!inTag) {
        charCount++;
        if (charCount <= maxLength) {
          lastGoodPosition = i + 1;
        } else {
          break;
        }
      }
    }
    
    // Налазимо последњи завршни таг пре позиције сечења
    const truncated = html.substring(0, lastGoodPosition);
    const lastTagEnd = truncated.lastIndexOf('>');
    const lastTagStart = truncated.lastIndexOf('<');
    
    if (lastTagStart > lastTagEnd && lastTagStart < truncated.length - 1) {
      // Налазимо се унутар тага, враћамо до почетка тага
      return truncated.substring(0, lastTagStart) + '...';
    }
    
    return truncated + '...';
  };
  
  const displayBiography = isExpanded 
    ? biography 
    : shouldShowMore 
      ? getTruncatedHtml(biography, 300)
      : biography;

  const imageUrl = person.person_image 
    ? person.person_image.startsWith('http')
      ? person.person_image
      : `${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${person.person_image}`
    : null;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 mb-6 border border-gray-200">
      <Link href={`/person/${person.slug}`} className="block">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Слика - на мобилним изнад, на десктопу десно */}
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
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {person.full_name}
            </h2>

            {/* Области (тагови) */}
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
            {biography && (
              <div className="mb-4">
                <div 
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: isExpanded ? biography : displayBiography 
                  }}
                />
                {shouldShowMore && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsExpanded(!isExpanded);
                    }}
                    className="mt-2 text-red-600 hover:underline text-sm font-medium"
                  >
                    {isExpanded ? '...мање' : '...више'}
                  </button>
                )}
              </div>
            )}

            {/* Source - испод текста, али изнад детаља */}
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
                          onClick={(e) => e.stopPropagation()}
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
      </Link>
    </div>
  );
}

