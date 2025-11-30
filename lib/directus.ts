/**
 * Directus API интеграција
 * Публичан приступ без аутентификације
 */

// За server-side користимо DIRECTUS_URL (интерни URL у Docker-у), за client-side NEXT_PUBLIC_DIRECTUS_URL
// Важно: DIRECTUS_URL се учитава у runtime, NEXT_PUBLIC_DIRECTUS_URL се уграђује у build time
// Овај фајл се користи само у server-side компонентама, па користимо DIRECTUS_URL прво
function getDirectusUrl(): string {
  // У runtime проверавамо DIRECTUS_URL прво (за Docker интерну мрежу)
  if (typeof window === 'undefined' && process.env.DIRECTUS_URL) {
    return process.env.DIRECTUS_URL;
  }
  // Fallback на NEXT_PUBLIC_DIRECTUS_URL или default
  return process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://185.229.119.44:8155';
}

const DIRECTUS_URL = getDirectusUrl();

export interface Person {
  id: string | number;
  full_name: string;
  slug: string;
  area?: Area[];
  person_image?: string;
  biography?: string;
  source?: Source[];
  status: string;
  sort?: number;
}

export interface Area {
  id: number;
  name: string;
  slug: string;
  status: string;
  sort?: number;
}

export interface Source {
  id: number;
  naziv?: string;
  slug?: string;
  source_type?: string;
  publisher?: string;
  url?: string;
  file_snapshot?: string;
  notes?: string;
  status?: string;
}

export interface Place {
  id: string;
  naziv?: string;
  name?: string;
}

export interface PublicOffice {
  id: number | string;
  person: number | Person | string;
  title: string;
  body?: string;
  institucija?: string;
  level?: string;
  place?: string | Place;
  province?: string;
  start_date?: string;
  end_date?: string;
  appointed_or_elected?: string;
  description?: string;
  images?: string[];
  video?: string;
  source?: Source[];   // стари назив поља
  sources?: Source[];  // новији назив поља у Directus-у
  status: string;
}

export interface Activity {
  id: number | string;
  title: string;
  type?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  place?: string | Place;
  persons?: (number | string | Person)[];
  images?: string[];
  video?: string;
  source?: Source[];
  sources?: Source[];
  status: string;
  sort?: number;
}

export interface Tema {
  id: number | string;
  name: string;
  description: string;
  date_from?: string;
  date_to?: string;
  images?: string[];
  sources?: Source[];
  status: string;
  sort?: number;
}

async function fetchSourcesByIds(ids: (string | number)[]): Promise<Map<string, Source>> {
  if (!ids || ids.length === 0) return new Map();

  const uniqueIds = Array.from(new Set(ids.map((id) => String(id))));
  const url = `${DIRECTUS_URL}/items/source?filter[id][_in]=${uniqueIds.join(',')}`;

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Directus API error for sources (${response.status}):`, {
        status: response.status,
        statusText: response.statusText,
        url,
        errorText,
      });
      return new Map();
    }

    const result = await response.json();
    const list: Source[] = result.data || [];
    const map = new Map<string, Source>();
    list.forEach((s) => {
      map.set(String(s.id), s);
    });
    return map;
  } catch (err) {
    console.error('Error fetching sources:', err);
    return new Map();
  }
}

/**
 * Дохвата активности за личност
 */
export async function getActivitiesByPerson(personId: string | number): Promise<Activity[]> {
  try {
    console.log('Fetching activities for person:', personId);

    // Дохватамо све активности са релацијама, па филтрирамо локално
    // Важно: експлицитно тражимо persons.* (за person_id), images.directus_files_id и sources.*
    const url = `${DIRECTUS_URL}/items/activity?limit=1000&fields=*,place.naziv,persons.*,images.directus_files_id,sources.*`;

    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Directus API error for activities (${response.status}):`, {
        status: response.status,
        statusText: response.statusText,
        url,
        errorText,
      });
      return [];
    }

    const result = await response.json();
    let activities: any[] = result.data || [];

    console.log('Total activities fetched:', activities.length);

    activities = activities.filter((a: any) => {
      if (a.status !== 'published') return false;

      if (!a.persons) return false;

      const personsField = a.persons;
      let ids: (string | number)[] = [];

      if (Array.isArray(personsField)) {
        ids = personsField.map((p: any) => {
          if (typeof p === 'object' && p !== null) {
            return p.person_id || p.id || p;
          }
          return p;
        });
      } else {
        // ако је single relation
        ids = [
          typeof personsField === 'object' && personsField !== null
            ? personsField.person_id || personsField.id || personsField
            : personsField,
        ];
      }

      return ids.some((id) => String(id) === String(personId));
    });

    console.log('Activities after filtering by person/status:', activities.length);

    // Резолвујемо изворе из sources (junction) преко source_id
    const allSourceIds: (string | number)[] = [];
    activities.forEach((a: any) => {
      (a.sources || []).forEach((link: any) => {
        if (link.source_id) {
          allSourceIds.push(link.source_id);
        }
      });
    });

    const sourceMap = await fetchSourcesByIds(allSourceIds);

    const normalized: Activity[] = activities.map((a: any) => {
      const resolvedSources =
        (a.sources || [])
          .map((link: any) => sourceMap.get(String(link.source_id)))
          .filter(Boolean) || [];

      // Нормализујемо слике на низ ID-ева датотека (string[])
      const normalizedImages: string[] = (a.images || [])
        .map((img: any) => {
          if (!img) return null;
          if (typeof img === 'string') return img;
          return img.directus_files_id || img.id || null;
        })
        .filter((id: string | null): id is string => Boolean(id))
        .slice(0, 3); // ограничавамо на 3 слике

      return {
        ...a,
        images: normalizedImages,
        sources: resolvedSources,
      } as Activity;
    });

    // Сортирање по датумима (као и за функције)
    return normalized.sort((a: Activity, b: Activity) => {
      const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
      const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;

      if (dateA !== dateB) {
        return dateA - dateB;
      }

      const endDateA = a.end_date ? new Date(a.end_date).getTime() : Infinity;
      const endDateB = b.end_date ? new Date(b.end_date).getTime() : Infinity;
      return endDateA - endDateB;
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return [];
  }
}

/**
 * Дохвата листу личности са насумичним сортирањем
 */
export async function getPersons(
  limit: number = 10,
  offset: number = 0,
  areaSlug?: string,
  searchName?: string,
  place?: string,
  level?: string
): Promise<{ data: Person[]; total: number }> {
  try {
    // Прво покушавамо са основним пољима + source (junction) да бисмо касније резолвовали изворе
    let url = `${DIRECTUS_URL}/items/person?limit=1000&fields=id,full_name,slug,person_image,biography,status,sort,source.*`;
    
    let response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Directus API error (${response.status}):`, {
        status: response.status,
        statusText: response.statusText,
        url,
        errorText,
      });
      return { data: [], total: 0 };
    }

    const result = await response.json();
    let persons = result.data || [];
    
    console.log('Directus API response - total persons:', persons.length);
    
    // Филтрирамо по статусу
    persons = persons.filter((p: Person) => p.status === 'published');
    console.log('After filtering by published:', persons.length);
    
    // Резолвујемо изворе из junction табеле person_source (поље source са source_id)
    try {
      const allSourceIds: (string | number)[] = [];
      persons.forEach((p: any) => {
        (p.source || []).forEach((link: any) => {
          if (link.source_id) {
            allSourceIds.push(link.source_id);
          }
        });
      });

      const sourceMap = await fetchSourcesByIds(allSourceIds);

      persons = persons.map((p: any) => {
        const resolvedSources =
          (p.source || [])
            .map((link: any) => sourceMap.get(String(link.source_id)))
            .filter(Boolean) || [];
        return {
          ...p,
          source: resolvedSources,
        } as Person;
      });
    } catch (err) {
      console.log('Error resolving person sources:', err);
    }
    
    // Ако је дат areaSlug, филтрирамо по области
    if (areaSlug) {
      persons = persons.filter((p: Person) => 
        p.area && p.area.some((a: Area) => a.slug === areaSlug)
      );
      console.log('After filtering by area:', persons.length);
    }

    // Филтрирање по имену (претрага)
    if (searchName) {
      const searchLower = searchName.toLowerCase();
      persons = persons.filter((p: Person) => 
        p.full_name.toLowerCase().includes(searchLower)
      );
      console.log('After filtering by name:', persons.length);
    }
    
    // Насумично мешамо
    const shuffled = [...persons].sort(() => Math.random() - 0.5);
    
    // Пагинација
    const paginated = shuffled.slice(offset, offset + limit);
    console.log('After pagination:', paginated.length, 'from', shuffled.length, 'total');
    console.log('Offset:', offset, 'Limit:', limit);

    return {
      data: paginated,
      total: shuffled.length,
    };
  } catch (error) {
    console.error('Error fetching persons:', error);
    return { data: [], total: 0 };
  }
}

/**
 * Дохвата појединачну личност по slug-у
 */
export async function getPersonBySlug(slug: string): Promise<Person | null> {
  try {
    console.log('Fetching person by slug:', slug);
    
    // Дохватамо све личности и филтрирамо по slug-у (као у getPersons)
    const url = `${DIRECTUS_URL}/items/person?limit=1000&fields=id,full_name,slug,person_image,biography,status,sort,source.*`;
    
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Directus API error (${response.status}):`, {
        status: response.status,
        statusText: response.statusText,
        url,
        errorText,
      });
      return null;
    }

    const result = await response.json();
    let persons = result.data || [];
    
    console.log('Total persons fetched:', persons.length);
    
    // Филтрирамо по статусу и slug-у
    persons = persons.filter((p: Person) => 
      p.status === 'published' && p.slug === slug
    );
    
    console.log('After filtering by slug and status:', persons.length);
    
    if (persons.length === 0) {
      console.log('No person found with slug:', slug);
      return null;
    }
    
    const person = persons[0];
    console.log('Found person:', person.full_name);
    
    // Резолвујемо изворе за ову личност преко source_id
    try {
      const allSourceIds: (string | number)[] = [];
      (person as any).source?.forEach((link: any) => {
        if (link.source_id) {
          allSourceIds.push(link.source_id);
        }
      });

      const sourceMap = await fetchSourcesByIds(allSourceIds);
      const resolvedSources =
        ((person as any).source || [])
          .map((link: any) => sourceMap.get(String(link.source_id)))
          .filter(Boolean) || [];

      (person as any).source = resolvedSources;
    } catch (err) {
      console.log('Error resolving sources for person:', err);
    }
    
    return person;
  } catch (error) {
    console.error('Error fetching person by slug:', error);
    return null;
  }
}

/**
 * Дохвата листу области (само published)
 */
export async function getAreas(): Promise<Area[]> {
  try {
    // Покушавамо са различитим форматима URL-а
    let urls = [
      `${DIRECTUS_URL}/items/area`,
      `${DIRECTUS_URL}/area`,
    ];
    
    let response: Response | null = null;
    let lastError: string = '';

    for (const url of urls) {
      try {
        console.log('Trying area URL:', url);
        response = await fetch(url, {
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          console.log('Success with area URL:', url);
          break;
        } else {
          const errorText = await response.text();
          lastError = errorText;
          console.log(`Failed with area URL ${url}:`, response.status, errorText);
        }
      } catch (err) {
        console.log(`Error with area URL ${url}:`, err);
        lastError = String(err);
      }
    }

    if (!response || !response.ok) {
      const errorText = lastError || await response?.text() || 'Unknown error';
      console.error(`Directus API error for areas (${response?.status || 'no response'}):`, {
        status: response?.status,
        statusText: response?.statusText,
        errorText,
      });
      // Враћамо празну листу уместо да бацамо грешку
      return [];
    }

    const result = await response.json();
    const areas = result.data || [];
    
    // Филтрирамо на клијентској страни ако није већ филтрирано
    const publishedAreas = areas.filter((area: Area) => area.status === 'published');
    
    // Сортирамо по sort пољу ако постоји
    return publishedAreas.sort((a: Area, b: Area) => {
      const sortA = a.sort ?? 0;
      const sortB = b.sort ?? 0;
      return sortA - sortB;
    });
  } catch (error) {
    console.error('Error fetching areas:', error);
    return [];
  }
}

/**
 * Дохвата функције/активности за личност
 */
export async function getPublicOfficesByPerson(personId: string | number): Promise<PublicOffice[]> {
  try {
    console.log('Fetching public offices for person:', personId);
    
    // Покушавамо са `fields=*` и релацијама да дохватимо сва поља
    // Подржавамо и стари назив поља (source) и новији (sources)
    let url = `${DIRECTUS_URL}/items/public_office?limit=1000&fields=*,place.naziv,source.*,sources.*`;
    
           let response = await fetch(url, {
             cache: 'no-store',
             headers: {
               'Content-Type': 'application/json',
               'Accept': 'application/json',
             },
           });

    // Ако не ради са `fields=*`, покушавамо без поља
    if (!response.ok) {
      console.log('Failed with fields=*, trying without fields...');
      url = `${DIRECTUS_URL}/items/public_office?limit=1000`;
             response = await fetch(url, {
               cache: 'no-store',
               headers: {
                 'Content-Type': 'application/json',
                 'Accept': 'application/json',
               },
             });
    }
    
    // Ако и даље не ради, покушавамо са експлицитним пољима
    if (!response.ok) {
      console.log('Failed without fields, trying with explicit fields...');
      url = `${DIRECTUS_URL}/items/public_office?limit=1000&fields=title,body,start_date,end_date,level,place,province,institucija,appointed_or_elected,description,status,person`;
             response = await fetch(url, {
               cache: 'no-store',
               headers: {
                 'Content-Type': 'application/json',
                 'Accept': 'application/json',
               },
             });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Directus API error (${response.status}):`, {
        status: response.status,
        statusText: response.statusText,
        url,
        errorText,
      });
      return [];
    }

    const result = await response.json();
    let offices = result.data || [];
    
    console.log('Total offices fetched:', offices.length);
    console.log('Result keys:', Object.keys(result));
    
    // Проверавамо да ли су објекти или само ID-ови
    if (offices.length > 0) {
      const firstOffice = offices[0];
      console.log('First office type:', typeof firstOffice);
      console.log('First office value:', firstOffice);
      
      // Ако је само стринг (UUID), Directus враћа само ID-ове
      if (typeof firstOffice === 'string') {
        console.log('Directus returned only IDs. This means Public Role needs field-level permissions.');
        console.log('Go to: Settings → Roles & Permissions → Public Role → Public Office');
        console.log('Make sure "Read" is enabled AND individual fields are allowed (not just "Read" permission)');
        return [];
      }
    }
    
    console.log('Sample office:', offices[0] ? {
      id: offices[0].id,
      title: offices[0].title,
      person: offices[0].person,
      status: offices[0].status,
      place: offices[0].place,
      source: offices[0].source,
      sources: offices[0].sources,
    } : 'No offices');
    console.log('Looking for personId:', personId, 'type:', typeof personId);
    
    // Филтрирамо на клијентској страни по person ID и статусу
    offices = offices.filter((o: any) => {
      // person може бити објекат, број, или string
      let officePersonId: string | number | undefined;
      
      // Проверавамо различите могуће структуре
      if (o.person) {
        if (typeof o.person === 'object' && o.person !== null) {
          officePersonId = o.person.id || o.person;
        } else {
          officePersonId = o.person;
        }
      } else if (o.person_id) {
        officePersonId = o.person_id;
      } else if (o.personId) {
        officePersonId = o.personId;
      }
      
      if (!officePersonId) {
        return false;
      }
      
      const matchesPerson = String(officePersonId) === String(personId);
      const matchesStatus = o.status === 'published';
      
      return matchesPerson && matchesStatus;
    });
    
    console.log('After filtering by person and status:', offices.length);
    
    // Резолвујемо изворе из junction табеле public_office_source (поља source/sources са source_id)
    if (offices.length > 0) {
      try {
        const allSourceIds: (string | number)[] = [];
        offices.forEach((o: any) => {
          (o.source || []).forEach((link: any) => {
            if (link.source_id) allSourceIds.push(link.source_id);
          });
          (o.sources || []).forEach((link: any) => {
            if (link.source_id) allSourceIds.push(link.source_id);
          });
        });

        const sourceMap = await fetchSourcesByIds(allSourceIds);

        offices = offices.map((o: any) => {
          const links = (o.source || o.sources || []) as any[];
          const resolvedSources =
            links.map((link) => sourceMap.get(String(link.source_id))).filter(Boolean) || [];
          return {
            ...o,
            source: resolvedSources,
            sources: resolvedSources,
          } as PublicOffice;
        });
      } catch (err) {
        console.log('Error resolving sources for offices:', err);
      }
    }
    
    // Сортирање: најстарије прво по start_date, ако се поклапају онда по end_date
    return offices.sort((a: PublicOffice, b: PublicOffice) => {
      const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
      const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
      
      if (dateA !== dateB) {
        return dateA - dateB; // Најстарије прво
      }
      
      // Ако се start_date поклапају, сортирај по end_date
      const endDateA = a.end_date ? new Date(a.end_date).getTime() : Infinity;
      const endDateB = b.end_date ? new Date(b.end_date).getTime() : Infinity;
      return endDateA - endDateB;
    });
  } catch (error) {
    console.error('Error fetching public offices:', error);
    return [];
  }
}

/**
 * Дохвата област по slug-у
 */
export async function getAreaBySlug(slug: string): Promise<Area | null> {
  try {
    // Прво покушавамо без филтрирања
    let url = `${DIRECTUS_URL}/items/area`;
    
    let response = await fetch(url, {
      next: { revalidate: 300 },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Ако не ради, покушавамо са филтрирањем
    if (!response.ok) {
      url = `${DIRECTUS_URL}/items/area?filter[slug][_eq]=${slug}&filter[status][_eq]=published`;
      response = await fetch(url, {
        next: { revalidate: 300 },
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Directus API error (${response.status}):`, {
        status: response.status,
        statusText: response.statusText,
        url,
        errorText,
      });
      return null;
    }

    const result = await response.json();
    const areas = result.data || [];
    
    // Филтрирамо на клијентској страни
    const area = areas.find((a: Area) => a.slug === slug && a.status === 'published');
    return area || null;
  } catch (error) {
    console.error('Error fetching area by slug:', error);
    return null;
  }
}

/**
 * Дохвата листу тема (поређаних по sort у растућем низу)
 */
export async function getTemas(): Promise<Tema[]> {
  try {
    console.log('Fetching temas...');
    
    // Дохватамо све теме са релацијама
    const url = `${DIRECTUS_URL}/items/tema?limit=1000&fields=*,images.directus_files_id,sources.*`;
    
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Directus API error for temas (${response.status}):`, {
        status: response.status,
        statusText: response.statusText,
        url,
        errorText,
      });
      return [];
    }

    const result = await response.json();
    let temas: any[] = result.data || [];

    console.log('Total temas fetched:', temas.length);

    // Филтрирамо по статусу
    temas = temas.filter((t: any) => t.status === 'published');
    console.log('After filtering by published:', temas.length);

    // Резолвујемо изворе из sources (junction) преко source_id
    const allSourceIds: (string | number)[] = [];
    temas.forEach((t: any) => {
      (t.sources || []).forEach((link: any) => {
        if (link.source_id) {
          allSourceIds.push(link.source_id);
        }
      });
    });

    const sourceMap = await fetchSourcesByIds(allSourceIds);

    // Нормализујемо слике на низ ID-ева датотека (string[])
    const normalized: Tema[] = temas.map((t: any) => {
      const resolvedSources =
        (t.sources || [])
          .map((link: any) => sourceMap.get(String(link.source_id)))
          .filter(Boolean) || [];

      const normalizedImages: string[] = (t.images || [])
        .map((img: any) => {
          if (!img) return null;
          if (typeof img === 'string') return img;
          return img.directus_files_id || img.id || null;
        })
        .filter((id: string | null): id is string => Boolean(id))
        .slice(0, 3); // ограничавамо на 3 слике

      return {
        ...t,
        images: normalizedImages,
        sources: resolvedSources,
      } as Tema;
    });

    // Сортирамо по sort пољу у растућем низу
    return normalized.sort((a: Tema, b: Tema) => {
      const sortA = a.sort ?? 0;
      const sortB = b.sort ?? 0;
      return sortA - sortB;
    });
  } catch (error) {
    console.error('Error fetching temas:', error);
    return [];
  }
}

