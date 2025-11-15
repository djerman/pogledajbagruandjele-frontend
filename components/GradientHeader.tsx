export default function GradientHeader() {
  return (
    <div className="bg-gradient-to-b from-red-900 via-red-800 to-black text-white">
      <div className="container mx-auto px-4 py-4">
        {/* Нови стихови */}
        <div className="text-center">
          <div className="max-w-2xl mx-auto">
            <p className="text-lg md:text-xl italic leading-relaxed whitespace-pre-line">
              Њихова душа је проклета{'\n'}
              Свима су ставили амове{'\n'}
              Себи саградили храмове{'\n'}
              Руке им огрезле у крв
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

