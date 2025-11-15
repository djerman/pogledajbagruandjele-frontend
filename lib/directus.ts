/**
 * Directus API интеграција
 * Публичан приступ без аутентификације
 */

// За server-side користимо DIRECTUS_URL (интерни URL у Docker-у), за client-side NEXT_PUBLIC_DIRECTUS_URL
const DIRECTUS_URL = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://185.229.119.44:8155';

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
  name?: string;
  url?: string;
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
  source?: Source[];
  status: string;
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
    // Прво покушавамо са основним пољима без релација (ово ради)
    let url = `${DIRECTUS_URL}/items/person?limit=1000&fields=id,full_name,slug,person_image,biography,status,sort`;
    
    let response = await fetch(url, {
      next: { revalidate: 60 },
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
    
    // Покушавамо да дохватимо релације за све личности одједном
    // Ако не ради, користимо основна поља без релација
    try {
      const relationsUrl = `${DIRECTUS_URL}/items/person?limit=1000&fields=id,area.id,area.name,area.slug,source.id,source.name,source.url`;
      const relationsResponse = await fetch(relationsUrl, {
        next: { revalidate: 60 },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      
      if (relationsResponse.ok) {
        const relationsResult = await relationsResponse.json();
        const relationsMap = new Map();
        
        relationsResult.data?.forEach((p: any) => {
          relationsMap.set(p.id, {
            area: p.area || [],
            source: p.source || [],
          });
        });
        
        // Додајемо релације на личности
        persons = persons.map((person: Person) => {
          const relations = relationsMap.get(person.id);
          if (relations) {
            person.area = relations.area;
            person.source = relations.source;
          }
          return person;
        });
        
        console.log('Relations loaded successfully');
      } else {
        console.log('Could not load relations, continuing without them');
      }
    } catch (err) {
      console.log('Error loading relations:', err);
      // Настављамо без релација
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
    const url = `${DIRECTUS_URL}/items/person?limit=1000&fields=id,full_name,slug,person_image,biography,status,sort`;
    
    const response = await fetch(url, {
      next: { revalidate: 60 },
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
    
    // Покушавамо да дохватимо релације - дохватамо све личности са релацијама
    try {
      const relationsUrl = `${DIRECTUS_URL}/items/person?limit=1000&fields=id,area.id,area.name,area.slug,source.id,source.name,source.url`;
      const relationsResponse = await fetch(relationsUrl, {
        next: { revalidate: 60 },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      
      if (relationsResponse.ok) {
        const relationsResult = await relationsResponse.json();
        const personWithRelations = relationsResult.data?.find((p: any) => String(p.id) === String(person.id));
        
        if (personWithRelations) {
          person.area = personWithRelations.area || [];
          person.source = personWithRelations.source || [];
          console.log('Relations loaded:', {
            areas: person.area?.length || 0,
            sources: person.source?.length || 0
          });
        } else {
          console.log('Person not found in relations result');
        }
      } else {
        const errorText = await relationsResponse.text();
        console.log('Could not load relations, status:', relationsResponse.status, errorText);
      }
    } catch (err) {
      console.log('Error loading relations for person:', err);
      // Настављамо без релација
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
          next: { revalidate: 300 },
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
    let url = `${DIRECTUS_URL}/items/public_office?limit=1000&fields=*,place.naziv,source.*`;
    
    let response = await fetch(url, {
      next: { revalidate: 60 },
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
        next: { revalidate: 60 },
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
        next: { revalidate: 60 },
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
      status: offices[0].status
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
    
    // Покушавамо да дохватимо релације (source, place) за сваку функцију/активност
    if (offices.length > 0) {
      try {
        // Модел mesto користи `naziv` уместо `name`
        const relationsUrl = `${DIRECTUS_URL}/items/public_office?limit=1000&fields=id,source.id,source.name,source.url,place.id,place.naziv`;
        const relationsResponse = await fetch(relationsUrl, {
          next: { revalidate: 60 },
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        });
        
        if (relationsResponse.ok) {
          const relationsResult = await relationsResponse.json();
          const relationsMap = new Map();
          
          relationsResult.data?.forEach((o: any) => {
            relationsMap.set(o.id, {
              source: o.source || [],
              place: o.place || null,
            });
          });
          
          // Додајемо релације на функције/активности
          offices = offices.map((office: PublicOffice) => {
            const relations = relationsMap.get(office.id);
            if (relations) {
              office.source = relations.source;
              if (relations.place) {
                office.place = relations.place;
              }
            }
            return office;
          });
        } else {
          const errorText = await relationsResponse.text();
          console.log('Failed to load relations:', relationsResponse.status, errorText);
        }
      } catch (err) {
        console.log('Error loading relations for offices:', err);
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

