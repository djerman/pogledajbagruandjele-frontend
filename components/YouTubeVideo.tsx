'use client';

interface YouTubeVideoProps {
  videoId?: string;
  videoUrl?: string;
}

export default function YouTubeVideo({ videoId, videoUrl }: YouTubeVideoProps) {
  // Ако је дат videoId, користимо га директно
  // Ако је дат videoUrl, извлачимо ID из URL-а
  let finalVideoId = videoId;

  if (!finalVideoId && videoUrl) {
    // Извлачимо video ID из YouTube URL-а
    const match = videoUrl.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    if (match) {
      finalVideoId = match[1];
    }
  }

  if (!finalVideoId) {
    return null;
  }

  return (
    <div className="w-full my-8">
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          src={`https://www.youtube.com/embed/${finalVideoId}`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}

