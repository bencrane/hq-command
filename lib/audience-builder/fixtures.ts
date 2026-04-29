import type {
  AudienceQuery,
  AudienceRow,
  CountResponse,
  CriteriaSchema,
  JoinStrategy,
  ResolveResponse,
  SourceId,
} from './schema';

// ---------------------------------------------------------------------------
// Option lists used inside the fixture schema
// ---------------------------------------------------------------------------

const STATE_CODES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS',
  'KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY',
  'NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

const STATE_OPTIONS = STATE_CODES.map((s) => ({ value: s, label: s }));

const NAICS_SECTOR_OPTIONS = [
  { value: '11', label: '11 · Agriculture' },
  { value: '21', label: '21 · Mining' },
  { value: '22', label: '22 · Utilities' },
  { value: '23', label: '23 · Construction' },
  { value: '31', label: '31 · Manufacturing' },
  { value: '32', label: '32 · Manufacturing' },
  { value: '33', label: '33 · Manufacturing' },
  { value: '42', label: '42 · Wholesale' },
  { value: '44', label: '44 · Retail' },
  { value: '45', label: '45 · Retail' },
  { value: '48', label: '48 · Transportation' },
  { value: '49', label: '49 · Transportation/Warehousing' },
  { value: '51', label: '51 · Information' },
  { value: '52', label: '52 · Finance' },
  { value: '53', label: '53 · Real Estate' },
  { value: '54', label: '54 · Professional/Scientific' },
  { value: '55', label: '55 · Management' },
  { value: '56', label: '56 · Admin/Support' },
  { value: '61', label: '61 · Education' },
  { value: '62', label: '62 · Healthcare' },
  { value: '71', label: '71 · Arts/Entertainment' },
  { value: '72', label: '72 · Accommodation/Food' },
  { value: '81', label: '81 · Other Services' },
  { value: '92', label: '92 · Public Admin' },
];

const VERTICAL_OPTIONS = [
  { value: 'trucking', label: 'Trucking' },
  { value: 'construction', label: 'Construction' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'professional_services', label: 'Professional services' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'logistics', label: 'Logistics' },
];

const ADDRESS_QUALITY_OPTIONS = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const AWARD_RECENCY_OPTIONS = [
  { value: 'last_30d', label: 'Last 30 days' },
  { value: 'last_90d', label: 'Last 90 days' },
  { value: 'last_180d', label: 'Last 180 days' },
  { value: 'last_365d', label: 'Last 365 days' },
];

const SET_ASIDE_OPTIONS = [
  { value: 'small_business', label: 'Small Business' },
  { value: 'sba_8a', label: '8(a)' },
  { value: 'hubzone', label: 'HUBZone' },
  { value: 'sdvosb', label: 'SDVOSB' },
  { value: 'wosb', label: 'WOSB' },
  { value: 'edwosb', label: 'EDWOSB' },
  { value: 'vosb', label: 'VOSB' },
  { value: 'minority_owned', label: 'Minority-owned' },
];

const AGENCY_OPTIONS = [
  { value: 'DOD', label: 'Department of Defense' },
  { value: 'GSA', label: 'GSA' },
  { value: 'VA', label: 'Veterans Affairs' },
  { value: 'DOT', label: 'Department of Transportation' },
  { value: 'NASA', label: 'NASA' },
  { value: 'DHS', label: 'Homeland Security' },
  { value: 'HHS', label: 'Health & Human Services' },
];

const SAM_REGISTRATION_STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'Expired', label: 'Expired' },
];

const FMCSA_OPERATION_OPTIONS = [
  { value: 'A', label: 'A · Authorized for-hire' },
  { value: 'B', label: 'B · Exempt for-hire' },
  { value: 'C', label: 'C · Private (property)' },
];

const AUTHORITY_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const SAFETY_RATING_OPTIONS = [
  { value: 'S', label: 'Satisfactory' },
  { value: 'C', label: 'Conditional' },
  { value: 'U', label: 'Unsatisfactory' },
];

// ---------------------------------------------------------------------------
// Schema fixture — full v1 taxonomy
// ---------------------------------------------------------------------------

export const fixtureSchema: CriteriaSchema = {
  groups: [
    { id: 'geography', label: 'Geography', order: 1 },
    { id: 'industry', label: 'Industry & sector', order: 2 },
    { id: 'size', label: 'Size & footprint', order: 3 },
    { id: 'mailing', label: 'Mailing & address quality', order: 4 },
    { id: 'usaspending', label: 'Federal contract activity', order: 11 },
    { id: 'sam', label: 'SAM registration', order: 12 },
    { id: 'fmcsa', label: 'Carrier attributes (FMCSA)', order: 13 },
  ],
  criteria: [
    // Geography (cross-source)
    {
      key: 'physical_state',
      label: 'State',
      group: 'geography',
      type: 'multiselect',
      operators: ['in'],
      options: STATE_OPTIONS,
      supported_sources: ['fmcsa', 'usaspending', 'sam'],
    },
    {
      key: 'physical_zip3',
      label: 'ZIP3',
      group: 'geography',
      type: 'multiselect',
      operators: ['in'],
      supported_sources: ['fmcsa', 'usaspending', 'sam'],
      description: 'First three digits of ZIP. Comma-separated, e.g. "100,941".',
    },
    {
      key: 'physical_zip5',
      label: 'ZIP5',
      group: 'geography',
      type: 'multiselect',
      operators: ['in'],
      supported_sources: ['fmcsa', 'usaspending', 'sam'],
    },
    {
      key: 'congressional_district',
      label: 'Congressional district',
      group: 'geography',
      type: 'multiselect',
      operators: ['in'],
      supported_sources: ['usaspending', 'sam'],
    },

    // Industry
    {
      key: 'naics_sector',
      label: 'NAICS sector',
      group: 'industry',
      type: 'multiselect',
      operators: ['in'],
      options: NAICS_SECTOR_OPTIONS,
      supported_sources: ['fmcsa', 'usaspending', 'sam'],
    },
    {
      key: 'naics_code_prefix',
      label: 'NAICS prefix',
      group: 'industry',
      type: 'text',
      operators: ['contains'],
      supported_sources: ['usaspending', 'sam'],
      description: 'NAICS code starts with this prefix.',
    },
    {
      key: 'vertical_keys',
      label: 'Vertical (DMaaS)',
      group: 'industry',
      type: 'multiselect',
      operators: ['in'],
      supported_sources: ['fmcsa', 'usaspending', 'sam'],
      options: VERTICAL_OPTIONS,
    },

    // Mailing
    {
      key: 'is_mailable_us',
      label: 'Mailable US address',
      group: 'mailing',
      type: 'boolean',
      operators: ['eq'],
      supported_sources: ['usaspending'],
    },
    {
      key: 'address_quality',
      label: 'Address quality',
      group: 'mailing',
      type: 'multiselect',
      operators: ['in'],
      options: ADDRESS_QUALITY_OPTIONS,
      supported_sources: ['usaspending'],
    },

    // USAspending
    {
      key: 'min_obligation_12mo',
      label: 'Min federal obligation (12mo $)',
      group: 'usaspending',
      type: 'currency',
      operators: ['gte'],
      supported_sources: ['usaspending'],
    },
    {
      key: 'min_obligation_90d',
      label: 'Min federal obligation (90d $)',
      group: 'usaspending',
      type: 'currency',
      operators: ['gte'],
      supported_sources: ['usaspending'],
    },
    {
      key: 'min_obligation_365d',
      label: 'Min federal obligation (365d $)',
      group: 'usaspending',
      type: 'currency',
      operators: ['gte'],
      supported_sources: ['usaspending'],
    },
    {
      key: 'award_recency_band',
      label: 'Award recency',
      group: 'usaspending',
      type: 'multiselect',
      operators: ['in'],
      options: AWARD_RECENCY_OPTIONS,
      supported_sources: ['usaspending'],
    },
    {
      key: 'set_aside_flags',
      label: 'Set-aside',
      group: 'usaspending',
      type: 'multiselect',
      operators: ['in'],
      options: SET_ASIDE_OPTIONS,
      supported_sources: ['usaspending'],
    },
    {
      key: 'agencies_any',
      label: 'Awarding agency',
      group: 'usaspending',
      type: 'multiselect',
      operators: ['in'],
      options: AGENCY_OPTIONS,
      supported_sources: ['usaspending'],
    },
    {
      key: 'is_first_time_winner',
      label: 'First-time winner',
      group: 'usaspending',
      type: 'boolean',
      operators: ['eq'],
      supported_sources: ['usaspending'],
    },

    // SAM
    {
      key: 'sam_active',
      label: 'SAM active',
      group: 'sam',
      type: 'boolean',
      operators: ['eq'],
      supported_sources: ['sam'],
    },
    {
      key: 'registration_status',
      label: 'Registration status',
      group: 'sam',
      type: 'multiselect',
      operators: ['in'],
      options: SAM_REGISTRATION_STATUS_OPTIONS,
      supported_sources: ['sam'],
    },
    {
      key: 'registration_expiring_within_days',
      label: 'Expiring within (days)',
      group: 'sam',
      type: 'integer',
      operators: ['lte'],
      supported_sources: ['sam'],
    },

    // FMCSA
    {
      key: 'min_fleet_power_units',
      label: 'Min fleet (power units)',
      group: 'fmcsa',
      type: 'integer',
      operators: ['gte'],
      supported_sources: ['fmcsa'],
    },
    {
      key: 'max_fleet_power_units',
      label: 'Max fleet (power units)',
      group: 'fmcsa',
      type: 'integer',
      operators: ['lte'],
      supported_sources: ['fmcsa'],
    },
    {
      key: 'min_drivers',
      label: 'Min drivers',
      group: 'fmcsa',
      type: 'integer',
      operators: ['gte'],
      supported_sources: ['fmcsa'],
    },
    {
      key: 'max_drivers',
      label: 'Max drivers',
      group: 'fmcsa',
      type: 'integer',
      operators: ['lte'],
      supported_sources: ['fmcsa'],
    },
    {
      key: 'carrier_operation_code',
      label: 'Carrier operation',
      group: 'fmcsa',
      type: 'multiselect',
      operators: ['in'],
      options: FMCSA_OPERATION_OPTIONS,
      supported_sources: ['fmcsa'],
    },
    {
      key: 'authority_status',
      label: 'Authority status',
      group: 'fmcsa',
      type: 'select',
      operators: ['eq'],
      options: AUTHORITY_STATUS_OPTIONS,
      supported_sources: ['fmcsa'],
    },
    {
      key: 'hazmat_only',
      label: 'Hazmat only',
      group: 'fmcsa',
      type: 'boolean',
      operators: ['eq'],
      supported_sources: ['fmcsa'],
    },
    {
      key: 'safety_rating_code',
      label: 'Safety rating',
      group: 'fmcsa',
      type: 'multiselect',
      operators: ['in'],
      options: SAFETY_RATING_OPTIONS,
      supported_sources: ['fmcsa'],
    },
    {
      key: 'has_active_oos',
      label: 'Active OOS order',
      group: 'fmcsa',
      type: 'boolean',
      operators: ['eq'],
      supported_sources: ['fmcsa'],
    },
    {
      key: 'min_safety_percentile',
      label: 'Min safety percentile',
      group: 'fmcsa',
      type: 'integer',
      operators: ['gte'],
      supported_sources: ['fmcsa'],
    },
    {
      key: 'min_crash_count_12mo',
      label: 'Min crashes (12mo)',
      group: 'fmcsa',
      type: 'integer',
      operators: ['gte'],
      supported_sources: ['fmcsa'],
    },
  ],
};

// ---------------------------------------------------------------------------
// Row fixture — 250 deterministic rows across single-source + bridge cases
// ---------------------------------------------------------------------------

interface RowSeed {
  primary: 'uei' | 'dot' | 'pdl_id';
  uei?: string;
  dot?: string;
  pdl?: string;
  name: string;
  state: string;
  city: string;
  naicsCode: string;
  naicsDesc: string;
  hasFmcsa: boolean;
  hasUsa: boolean;
  hasSam: boolean;
  hasPdl: boolean;
  // FMCSA
  powerUnits?: number;
  drivers?: number;
  operationCode?: string;
  authorityActive?: boolean;
  hazmat?: boolean;
  safetyRating?: string;
  hasActiveOos?: boolean;
  safetyPercentile?: number;
  crashCount12mo?: number;
  // USAspending
  obligation12mo?: number;
  obligation90d?: number;
  obligation365d?: number;
  setAsides?: string[];
  agency?: string;
  awardRecency?: string;
  isFirstTime?: boolean;
  isMailable?: boolean;
  addressQuality?: string;
  // SAM
  registrationStatus?: string;
  registrationExpiringDays?: number;
}

function makeRow(seed: RowSeed): AudienceRow {
  const id =
    seed.primary === 'uei'
      ? `uei:${seed.uei}`
      : seed.primary === 'dot'
        ? `dot:${seed.dot}`
        : `pdl_id:${seed.pdl}`;
  return {
    id,
    primary_id_kind: seed.primary,
    ids: {
      uei: seed.uei ?? null,
      dot: seed.dot ?? null,
      pdl_id: seed.pdl ?? null,
      mc_mx_ff_numbers: seed.dot ? [`MC-${seed.dot}`] : [],
    },
    name: seed.name,
    physical_state: seed.state,
    physical_city: seed.city,
    primary_naics_code: seed.naicsCode,
    primary_naics_description: seed.naicsDesc,
    fmcsa: seed.hasFmcsa
      ? {
          dot_number: seed.dot,
          legal_name: seed.name,
          dba_name: null,
          physical_state: seed.state,
          physical_city: seed.city,
          power_unit_count: seed.powerUnits ?? 0,
          driver_total: seed.drivers ?? 0,
          carrier_operation_code: seed.operationCode ?? 'A',
          authority_status: seed.authorityActive ? 'active' : 'inactive',
          hazmat_only: seed.hazmat ?? false,
          safety_rating_code: seed.safetyRating ?? null,
          has_active_oos: seed.hasActiveOos ?? false,
          safety_percentile: seed.safetyPercentile ?? null,
          crash_count_12mo: seed.crashCount12mo ?? 0,
          status_code: 'A',
          mc_mx_ff_numbers: seed.dot ? [`MC-${seed.dot}`] : [],
        }
      : null,
    usaspending: seed.hasUsa
      ? {
          uei: seed.uei,
          recipient_name: seed.name,
          physical_state: seed.state,
          primary_naics_code: seed.naicsCode,
          obligation_12mo: seed.obligation12mo ?? 0,
          obligation_90d: seed.obligation90d ?? 0,
          obligation_365d: seed.obligation365d ?? 0,
          set_aside_flags: seed.setAsides ?? [],
          agencies_any: seed.agency ? [seed.agency] : [],
          award_recency_band: seed.awardRecency ?? null,
          is_first_time_winner: seed.isFirstTime ?? false,
          is_mailable_us: seed.isMailable ?? true,
          address_quality: seed.addressQuality ?? 'high',
        }
      : null,
    sam: seed.hasSam
      ? {
          uei: seed.uei,
          legal_business_name: seed.name,
          physical_state: seed.state,
          physical_city: seed.city,
          primary_naics_code: seed.naicsCode,
          registration_status: seed.registrationStatus ?? 'Active',
          sam_active: seed.registrationStatus === 'Active',
          registration_expiring_within_days: seed.registrationExpiringDays ?? null,
        }
      : null,
    pdl: seed.hasPdl
      ? {
          pdl_id: seed.pdl,
          name: seed.name,
          domain: `${slug(seed.name)}.com`,
          founded_year: 2010,
          employee_count: Math.max(seed.drivers ?? 10, 25),
          linkedin_url: `https://linkedin.com/company/${slug(seed.name)}`,
        }
      : null,
  };
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

const CITY_BY_STATE: Record<string, string[]> = {
  CA: ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'Fresno'],
  TX: ['Houston', 'Dallas', 'Austin', 'San Antonio', 'El Paso'],
  NY: ['New York', 'Buffalo', 'Rochester', 'Albany'],
  FL: ['Miami', 'Orlando', 'Tampa', 'Jacksonville'],
  IL: ['Chicago', 'Springfield', 'Naperville'],
  OH: ['Columbus', 'Cleveland', 'Cincinnati'],
  GA: ['Atlanta', 'Savannah', 'Augusta'],
  PA: ['Philadelphia', 'Pittsburgh', 'Harrisburg'],
  NC: ['Charlotte', 'Raleigh', 'Greensboro'],
  AZ: ['Phoenix', 'Tucson', 'Mesa'],
};

const ALL_STATES = Object.keys(CITY_BY_STATE);

const NAICS_OPTIONS: Array<[string, string]> = [
  ['484110', 'General Freight Trucking, Local'],
  ['484121', 'General Freight Trucking, Long-Distance, Truckload'],
  ['484122', 'General Freight Trucking, Long-Distance, Less Than Truckload'],
  ['238110', 'Poured Concrete Foundation and Structure Contractors'],
  ['238210', 'Electrical Contractors'],
  ['238220', 'Plumbing, Heating, and Air-Conditioning Contractors'],
  ['541330', 'Engineering Services'],
  ['541511', 'Custom Computer Programming Services'],
  ['541512', 'Computer Systems Design Services'],
  ['541612', 'Human Resources Consulting Services'],
  ['541618', 'Other Management Consulting Services'],
  ['541990', 'All Other Professional, Scientific, and Technical Services'],
  ['621111', 'Offices of Physicians'],
  ['623110', 'Nursing Care Facilities'],
  ['332710', 'Machine Shops'],
  ['333515', 'Cutting Tool and Machine Tool Accessory Manufacturing'],
  ['423830', 'Industrial Machinery and Equipment Merchant Wholesalers'],
  ['561720', 'Janitorial Services'],
  ['561730', 'Landscaping Services'],
  ['311111', 'Dog and Cat Food Manufacturing'],
];

const COMPANY_PREFIXES = [
  'Acme', 'Pioneer', 'Liberty', 'Summit', 'Cardinal', 'Eagle', 'Heritage', 'Atlas',
  'Beacon', 'Capitol', 'Frontier', 'Granite', 'Horizon', 'Keystone', 'Meridian',
  'Northstar', 'Patriot', 'Sentinel', 'Vanguard', 'Westmark',
];
const COMPANY_SUFFIXES = [
  'Logistics', 'Transport', 'Freight', 'Industries', 'Systems', 'Services',
  'Solutions', 'Holdings', 'Group', 'Partners', 'Manufacturing', 'Construction',
  'Healthcare', 'Consulting', 'Engineering', 'Trucking',
];

function buildSeeds(): RowSeed[] {
  const rand = rng(42);
  const rows: RowSeed[] = [];
  for (let i = 0; i < 250; i++) {
    // Decide profile bucket
    const r = rand();
    let bucket: 'fmcsa' | 'usa' | 'sam' | 'fmcsa+usa' | 'usa+sam' | 'all3' | 'fmcsa+sam';
    if (r < 0.18) bucket = 'fmcsa';
    else if (r < 0.36) bucket = 'usa';
    else if (r < 0.54) bucket = 'sam';
    else if (r < 0.7) bucket = 'fmcsa+usa';
    else if (r < 0.85) bucket = 'usa+sam';
    else if (r < 0.95) bucket = 'all3';
    else bucket = 'fmcsa+sam';

    const state = ALL_STATES[Math.floor(rand() * ALL_STATES.length)];
    const cities = CITY_BY_STATE[state];
    const city = cities[Math.floor(rand() * cities.length)];
    const naicsIdx = Math.floor(rand() * NAICS_OPTIONS.length);
    const [naicsCode, naicsDesc] = NAICS_OPTIONS[naicsIdx];

    const prefix = COMPANY_PREFIXES[Math.floor(rand() * COMPANY_PREFIXES.length)];
    const suffix = COMPANY_SUFFIXES[Math.floor(rand() * COMPANY_SUFFIXES.length)];
    const name = `${prefix} ${suffix}`;

    const uei = `UEI${String(100000 + i)}`;
    const dot = String(1000000 + i);
    const pdl = `pdl-${i}-${slug(name)}`;

    const hasFmcsa = bucket.includes('fmcsa');
    const hasUsa = bucket.includes('usa') && !bucket.includes('fmcsa+sam');
    const hasSam = bucket.includes('sam') || bucket === 'all3';
    const hasPdl = bucket === 'all3' || bucket === 'fmcsa+usa' || bucket === 'fmcsa+sam';

    const powerUnits = hasFmcsa ? Math.floor(rand() * 200) + 1 : undefined;
    const drivers = hasFmcsa ? Math.floor(rand() * 250) + 1 : undefined;
    const obligation12mo = hasUsa ? Math.floor(rand() * 5_000_000) : undefined;

    rows.push({
      primary:
        bucket === 'fmcsa' ? 'dot' : hasUsa || hasSam ? 'uei' : 'pdl_id',
      uei: hasUsa || hasSam ? uei : undefined,
      dot: hasFmcsa ? dot : undefined,
      pdl: hasPdl ? pdl : undefined,
      name,
      state,
      city,
      naicsCode,
      naicsDesc,
      hasFmcsa,
      hasUsa,
      hasSam,
      hasPdl,
      powerUnits,
      drivers,
      operationCode: hasFmcsa ? (rand() < 0.6 ? 'A' : rand() < 0.5 ? 'B' : 'C') : undefined,
      authorityActive: hasFmcsa ? rand() < 0.85 : undefined,
      hazmat: hasFmcsa ? rand() < 0.15 : undefined,
      safetyRating: hasFmcsa
        ? rand() < 0.6
          ? 'S'
          : rand() < 0.5
            ? 'C'
            : 'U'
        : undefined,
      hasActiveOos: hasFmcsa ? rand() < 0.05 : undefined,
      safetyPercentile: hasFmcsa ? Math.floor(rand() * 100) : undefined,
      crashCount12mo: hasFmcsa ? Math.floor(rand() * 8) : undefined,
      obligation12mo,
      obligation90d: hasUsa ? Math.floor((obligation12mo ?? 0) * 0.25) : undefined,
      obligation365d: obligation12mo,
      setAsides: hasUsa
        ? rand() < 0.3
          ? ['small_business']
          : rand() < 0.2
            ? ['sba_8a', 'small_business']
            : []
        : undefined,
      agency: hasUsa
        ? ['DOD', 'GSA', 'VA', 'DOT', 'NASA'][Math.floor(rand() * 5)]
        : undefined,
      awardRecency: hasUsa
        ? ['last_30d', 'last_90d', 'last_180d', 'last_365d'][Math.floor(rand() * 4)]
        : undefined,
      isFirstTime: hasUsa ? rand() < 0.15 : undefined,
      isMailable: hasUsa ? rand() < 0.92 : undefined,
      addressQuality: hasUsa
        ? rand() < 0.7
          ? 'high'
          : rand() < 0.7
            ? 'medium'
            : 'low'
        : undefined,
      registrationStatus: hasSam
        ? rand() < 0.75
          ? 'Active'
          : rand() < 0.5
            ? 'Inactive'
            : 'Expired'
        : undefined,
      registrationExpiringDays: hasSam ? Math.floor(rand() * 365) : undefined,
    });
  }
  return rows;
}

const SEEDS = buildSeeds();
const ROWS: AudienceRow[] = SEEDS.map(makeRow);

// ---------------------------------------------------------------------------
// Filter the fixture rows by an AudienceQuery
// ---------------------------------------------------------------------------

function rowMatches(row: AudienceRow, query: AudienceQuery): boolean {
  for (const c of query.criteria) {
    const fmcsa = row.fmcsa as Record<string, unknown> | null;
    const usa = row.usaspending as Record<string, unknown> | null;
    const sam = row.sam as Record<string, unknown> | null;

    switch (c.key) {
      case 'physical_state': {
        const v = row.physical_state ?? '';
        if (!c.values?.includes(v)) return false;
        break;
      }
      case 'physical_zip3':
      case 'physical_zip5':
      case 'congressional_district':
        // No fixture data; treat as match (don't filter the user out artificially)
        break;
      case 'naics_sector': {
        const v = row.primary_naics_code?.slice(0, 2) ?? '';
        if (!c.values?.includes(v)) return false;
        break;
      }
      case 'naics_code_prefix': {
        const v = row.primary_naics_code ?? '';
        const needle = String(c.value ?? '');
        if (!v.startsWith(needle)) return false;
        break;
      }
      case 'vertical_keys':
        // No fixture mapping; pass-through.
        break;
      case 'is_mailable_us': {
        if (!usa) return false;
        if ((usa.is_mailable_us as boolean) !== Boolean(c.value)) return false;
        break;
      }
      case 'address_quality': {
        if (!usa) return false;
        if (!c.values?.includes(String(usa.address_quality))) return false;
        break;
      }
      case 'min_obligation_12mo':
      case 'min_obligation_90d':
      case 'min_obligation_365d': {
        if (!usa) return false;
        const k = c.key.replace('min_', '');
        if (Number(usa[k]) < Number(c.value)) return false;
        break;
      }
      case 'award_recency_band': {
        if (!usa) return false;
        if (!c.values?.includes(String(usa.award_recency_band))) return false;
        break;
      }
      case 'set_aside_flags': {
        if (!usa) return false;
        const flags = (usa.set_aside_flags as string[]) ?? [];
        if (!c.values?.some((v) => flags.includes(v))) return false;
        break;
      }
      case 'agencies_any': {
        if (!usa) return false;
        const agencies = (usa.agencies_any as string[]) ?? [];
        if (!c.values?.some((v) => agencies.includes(v))) return false;
        break;
      }
      case 'is_first_time_winner': {
        if (!usa) return false;
        if (Boolean(usa.is_first_time_winner) !== Boolean(c.value)) return false;
        break;
      }
      case 'sam_active': {
        if (!sam) return false;
        if (Boolean(sam.sam_active) !== Boolean(c.value)) return false;
        break;
      }
      case 'registration_status': {
        if (!sam) return false;
        if (!c.values?.includes(String(sam.registration_status))) return false;
        break;
      }
      case 'registration_expiring_within_days': {
        if (!sam) return false;
        const days = Number(sam.registration_expiring_within_days);
        if (!Number.isFinite(days) || days > Number(c.value)) return false;
        break;
      }
      case 'min_fleet_power_units': {
        if (!fmcsa) return false;
        if (Number(fmcsa.power_unit_count) < Number(c.value)) return false;
        break;
      }
      case 'max_fleet_power_units': {
        if (!fmcsa) return false;
        if (Number(fmcsa.power_unit_count) > Number(c.value)) return false;
        break;
      }
      case 'min_drivers': {
        if (!fmcsa) return false;
        if (Number(fmcsa.driver_total) < Number(c.value)) return false;
        break;
      }
      case 'max_drivers': {
        if (!fmcsa) return false;
        if (Number(fmcsa.driver_total) > Number(c.value)) return false;
        break;
      }
      case 'carrier_operation_code': {
        if (!fmcsa) return false;
        if (!c.values?.includes(String(fmcsa.carrier_operation_code))) return false;
        break;
      }
      case 'authority_status': {
        if (!fmcsa) return false;
        if (String(fmcsa.authority_status) !== String(c.value)) return false;
        break;
      }
      case 'hazmat_only': {
        if (!fmcsa) return false;
        if (Boolean(fmcsa.hazmat_only) !== Boolean(c.value)) return false;
        break;
      }
      case 'safety_rating_code': {
        if (!fmcsa) return false;
        if (!c.values?.includes(String(fmcsa.safety_rating_code))) return false;
        break;
      }
      case 'has_active_oos': {
        if (!fmcsa) return false;
        if (Boolean(fmcsa.has_active_oos) !== Boolean(c.value)) return false;
        break;
      }
      case 'min_safety_percentile': {
        if (!fmcsa) return false;
        if (Number(fmcsa.safety_percentile) < Number(c.value)) return false;
        break;
      }
      case 'min_crash_count_12mo': {
        if (!fmcsa) return false;
        if (Number(fmcsa.crash_count_12mo) < Number(c.value)) return false;
        break;
      }
      default:
        // Unknown key — let it through; backend will reject.
        break;
    }
  }
  return true;
}

function pickAppliedSources(query: AudienceQuery): SourceId[] {
  const used = new Set<SourceId>();
  for (const c of query.criteria) {
    const def = fixtureSchema.criteria.find((d) => d.key === c.key);
    if (!def) continue;
    for (const s of def.supported_sources) used.add(s);
  }
  // Heuristic: pick the most specific source per criterion. For cross-source criteria
  // (e.g. physical_state, naics_sector), default to the most-active source if any.
  if (used.size === 0) return ['fmcsa', 'usaspending', 'sam'];
  return Array.from(used).filter((s) => s !== 'pdl');
}

function pickJoinStrategy(applied: SourceId[]): JoinStrategy {
  const nonPdl = applied.filter((s) => s !== 'pdl');
  if (nonPdl.length <= 1) return 'single_source';
  if (nonPdl.includes('fmcsa')) return 'pdl_bridge';
  return 'uei_bridge';
}

// ---------------------------------------------------------------------------
// Public fixture API
// ---------------------------------------------------------------------------

export function fixtureResolve(query: AudienceQuery): ResolveResponse {
  const filtered = ROWS.filter((r) => rowMatches(r, query));
  const applied = pickAppliedSources(query);
  const strategy = pickJoinStrategy(applied);
  const start = query.offset;
  const end = start + query.limit;
  return {
    items: filtered.slice(start, end),
    total: filtered.length,
    limit: query.limit,
    offset: query.offset,
    applied_sources: applied,
    join_strategy: strategy,
    mv_sources: applied.map((s) => ({ view: `mv_${s}_targeting`, last_analyze: null })),
    generated_at: new Date().toISOString(),
  };
}

export function fixtureCount(query: AudienceQuery): CountResponse {
  const filtered = ROWS.filter((r) => rowMatches(r, query));
  const applied = pickAppliedSources(query);
  const strategy = pickJoinStrategy(applied);
  return {
    total: filtered.length,
    applied_sources: applied,
    join_strategy: strategy,
    estimated: false,
  };
}

export function fixtureEntity(id: string): AudienceRow | null {
  return ROWS.find((r) => r.id === id) ?? null;
}

export const fixtureRowCount = ROWS.length;
