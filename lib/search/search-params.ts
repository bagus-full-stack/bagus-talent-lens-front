export interface SearchFilters {
  query: string;
  minExperience: number;
  maxExperience: number;
  contractTypes: string[]; // 'cdi', 'cdd', 'freelance', 'alternance'
  location: string;
  radius: number; // in km: 0, 10, 25, 50, 100
  availability: string; // 'all', 'immediate', '1_month', '3_months', 'negotiable'
  languages: string[]; // 'fr', 'en', 'es', 'de'
  educationLevel: string; // 'all', 'bac3', 'bac5', 'doctorat', 'autodidacte'
  skills: string[];
  folderId: string; // 'all' or specific folder ID
  sortBy: 'relevance' | 'experience' | 'availability';
  cursor: number; // page number, default 1
}

export const DEFAULT_SEARCH_FILTERS: SearchFilters = {
  query: '',
  minExperience: 0,
  maxExperience: 15,
  contractTypes: [],
  location: '',
  radius: 25,
  availability: 'all',
  languages: [],
  educationLevel: 'all',
  skills: [],
  folderId: 'all',
  sortBy: 'relevance',
  cursor: 1,
};

export function parseSearchFiltersFromParams(
  params: URLSearchParams | { [key: string]: string | string[] | undefined }
): SearchFilters {
  const get = (key: string): string | null => {
    if (params instanceof URLSearchParams) {
      return params.get(key);
    }
    const val = params[key];
    if (Array.isArray(val)) return val[0] ?? null;
    return val ?? null;
  };

  const getArray = (key: string): string[] => {
    const raw = get(key);
    if (!raw) return [];
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const query = get('q') ?? '';
  const minExpRaw = get('minExp');
  const minExperience = minExpRaw !== null && !isNaN(Number(minExpRaw)) ? Math.max(0, Number(minExpRaw)) : 0;

  const maxExpRaw = get('maxExp');
  const maxExperience = maxExpRaw !== null && !isNaN(Number(maxExpRaw)) ? Math.min(20, Number(maxExpRaw)) : 15;

  const contractTypes = getArray('contract');
  const location = get('location') ?? '';
  const radiusRaw = get('radius');
  const radius = radiusRaw !== null && !isNaN(Number(radiusRaw)) ? Number(radiusRaw) : 25;

  const availability = get('avail') ?? 'all';
  const languages = getArray('lang');
  const educationLevel = get('edu') ?? 'all';
  const skills = getArray('skills');
  const folderId = get('folder') ?? 'all';

  const sortRaw = get('sort');
  const sortBy: SearchFilters['sortBy'] =
    sortRaw === 'experience' || sortRaw === 'availability' ? sortRaw : 'relevance';

  const cursorRaw = get('cursor') || get('page');
  const cursor = cursorRaw !== null && !isNaN(Number(cursorRaw)) ? Math.max(1, Number(cursorRaw)) : 1;

  return {
    query,
    minExperience,
    maxExperience,
    contractTypes,
    location,
    radius,
    availability,
    languages,
    educationLevel,
    skills,
    folderId,
    sortBy,
    cursor,
  };
}

export function buildSearchFiltersToParams(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.query && filters.query.trim()) {
    params.set('q', filters.query.trim());
  }

  if (filters.minExperience > 0) {
    params.set('minExp', filters.minExperience.toString());
  }

  if (filters.maxExperience < 15) {
    params.set('maxExp', filters.maxExperience.toString());
  }

  if (filters.contractTypes.length > 0) {
    params.set('contract', filters.contractTypes.join(','));
  }

  if (filters.location && filters.location.trim()) {
    params.set('location', filters.location.trim());
  }

  if (filters.radius !== 25) {
    params.set('radius', filters.radius.toString());
  }

  if (filters.availability && filters.availability !== 'all') {
    params.set('avail', filters.availability);
  }

  if (filters.languages.length > 0) {
    params.set('lang', filters.languages.join(','));
  }

  if (filters.educationLevel && filters.educationLevel !== 'all') {
    params.set('edu', filters.educationLevel);
  }

  if (filters.skills.length > 0) {
    params.set('skills', filters.skills.join(','));
  }

  if (filters.folderId && filters.folderId !== 'all') {
    params.set('folder', filters.folderId);
  }

  if (filters.sortBy !== 'relevance') {
    params.set('sort', filters.sortBy);
  }

  if (filters.cursor > 1) {
    params.set('cursor', filters.cursor.toString());
  }

  return params;
}

export function countActiveFilters(filters: SearchFilters): number {
  let count = 0;
  if (filters.minExperience > 0) count++;
  if (filters.maxExperience < 15) count++;
  if (filters.contractTypes.length > 0) count += filters.contractTypes.length;
  if (filters.location.trim()) count++;
  if (filters.radius !== 25 && filters.location.trim()) count++;
  if (filters.availability !== 'all') count++;
  if (filters.languages.length > 0) count += filters.languages.length;
  if (filters.educationLevel !== 'all') count++;
  if (filters.skills.length > 0) count += filters.skills.length;
  if (filters.folderId !== 'all') count++;
  return count;
}
