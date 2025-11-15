# PogledajBaGruAndjele – Frontend (pogledajbagruandjele-frontend)

Јавни UI (Next.js) за пројекат праћења јавних личности/политичара, њихових биографија, функција, афера и извора. Примарни језик интерфејса је српски (ћирилица).

> Напомена: Овај документ ће се мењати како пројекат напредује. Слободно дописуј и ажурирај циљеве и руте.

## Циљеви (мењаће се)
- Приказ личности са кључним метаподацима (име, фотографија, основна биографија).
- Историја политичке каријере: странке/покрети, јавне функције, периоди.
- Афере повезане са личностима, са временским оквиром и статусом.
- Активности после политике.
- Извори за сваку тврдњу (више извора, видљиви кориснику).
- Јавни UI на ћирилици, оптимизован за претрагу и дељење линкова.
- Интеграција са Directus (REST/GraphQL) као CMS/слој података.

## Планиране руте (почетна скела)
- `/` – почетна (истакнуте личности/афере, претрага)
- `/licnosti` – листа личности (филтери: странка, функција, период)
- `/licnosti/[slug]` – детаљ личности (био, функције, афере, активности, извори)
- `/afere` – листа афера
- `/afere/[slug]` – детаљ афере

URL-ови користе латиничну транслитерацију ради једноставнијих линкова; UI је на ћирилици.

## Технички стек
- Next.js 16 (App Router), React 19
- Tailwind CSS v4 (тема преко CSS променљивих `--background`, `--foreground`)
- Server Components + ISR/route cache за јавне странице
- Интеграција са Directus (када буде спреман) преко REST/GraphQL

## Локално покретање (dev)

```bash
npm install
npm run dev
# URL: http://localhost:3000
```

Уређуј `app/page.tsx` и остале руте у `app/`. Стили у `app/globals.css` (Tailwind v4 преко `@import "tailwindcss";`).

## Конфигурација окружења

### Локални развој (`.env.local`)
```
NEXT_PUBLIC_DIRECTUS_URL=http://localhost:8055
NEXT_PUBLIC_YOUTUBE_VIDEO_ID=ваш_youtube_video_id
# или
NEXT_PUBLIC_YOUTUBE_VIDEO_URL=https://www.youtube.com/watch?v=ваш_video_id
```

### Docker окружење (`.env.docker`)
```
NEXT_PUBLIC_DIRECTUS_URL=http://185.229.119.44:8155
DIRECTUS_URL=http://directus:8055
NEXT_PUBLIC_YOUTUBE_VIDEO_ID=ваш_youtube_video_id
```

**Напомене:**
- `NEXT_PUBLIC_DIRECTUS_URL` - јавни URL за Directus API (користи се у client-side компонентама)
- `DIRECTUS_URL` - интерни URL за Directus (користи се у server-side компонентама у Docker окружењу)
- `NEXT_PUBLIC_YOUTUBE_VIDEO_ID` или `NEXT_PUBLIC_YOUTUBE_VIDEO_URL` - опционално, за YouTube видео на почетној страни

## Архитектура / Стек интеграција
- Овај репо је независан frontend.
- У инфраструктурном репоу `pogledajbagruandjele-stack`, фронтенд ће бити клониран у поддиректоријум `pogledajbagruandjele-frontend/` и грађен преко `docker-compose.dev.yml` за dev/staging.
- Нема ручног копирања фронтенда – увек git clone/pull из овог репоа.

## План наредних корака
- Скеле за руте (`/licnosti`, `/licnosti/[slug]`, `/afere`, `/afere/[slug]`).
- Базне компоненте: `PersonCard`, `AffairCard`, `SourceList`, `Filters`.
- Mock подаци/adapter до интеграције са Directus.
- Тема и приступачност (accessibility), SEO метаподаци.

