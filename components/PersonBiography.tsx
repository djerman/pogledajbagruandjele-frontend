'use client';

import ExpandableHtml from './ExpandableHtml';

interface PersonBiographyProps {
  biography?: string | null;
}

/**
 * Биографија личности на страни /person/[slug]
 * - почетно приказује приближно 20 редова текста
 * - има дугме "...више / ...мање" као на почетној страни
 */
export default function PersonBiography({ biography }: PersonBiographyProps) {
  return <ExpandableHtml html={biography} maxLength={1000} />;
}



