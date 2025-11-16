'use client';

import { useState } from 'react';

interface ExpandableHtmlProps {
  html?: string | null;
  maxLength?: number;
}

/**
 * Компонента за приказ већег HTML текста са ограничењем на број карактера
 * и дугметом "...више / ...мање".
 */
export default function ExpandableHtml({ html, maxLength = 1000 }: ExpandableHtmlProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!html) return null;

  const textOnly = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  const shouldShowMore = textOnly.length > maxLength;

  const getTruncatedHtml = (sourceHtml: string, limit: number) => {
    if (textOnly.length <= limit) return sourceHtml;

    let charCount = 0;
    let inTag = false;
    let lastGoodPosition = 0;

    for (let i = 0; i < sourceHtml.length; i++) {
      if (sourceHtml[i] === '<') {
        inTag = true;
      } else if (sourceHtml[i] === '>') {
        inTag = false;
      } else if (!inTag) {
        charCount++;
        if (charCount <= limit) {
          lastGoodPosition = i + 1;
        } else {
          break;
        }
      }
    }

    const truncated = sourceHtml.substring(0, lastGoodPosition);
    const lastTagEnd = truncated.lastIndexOf('>');
    const lastTagStart = truncated.lastIndexOf('<');

    if (lastTagStart > lastTagEnd && lastTagStart < truncated.length - 1) {
      return truncated.substring(0, lastTagStart) + '...';
    }

    return truncated + '...';
  };

  const displayHtml = isExpanded
    ? html
    : shouldShowMore
      ? getTruncatedHtml(html, maxLength)
      : html;

  return (
    <div className="mb-4">
      <div
        className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: displayHtml }}
      />
      {shouldShowMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-red-600 hover:underline text-sm font-medium"
        >
          {isExpanded ? '...мање' : '...више'}
        </button>
      )}
    </div>
  );
}


