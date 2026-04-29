import { describe, expect, it } from 'vitest';

import { fixtureSchema } from '@/lib/audience-builder/fixtures';
import {
  audienceQuerySchema,
  validateAgainstSchema,
} from '@/lib/audience-builder/schema';
import { LEGACY_PATH_TO_STARTER, STARTERS, findStarter } from '@/lib/audience-builder/starters';

describe('audience-builder starters', () => {
  it('every starter passes the runtime audience query schema', () => {
    for (const s of STARTERS) {
      const result = audienceQuerySchema.safeParse(s.query);
      expect(result.success, `${s.slug} failed: ${result.success ? '' : result.error.message}`).toBe(true);
    }
  });

  it('every starter validates against the criteria schema', () => {
    for (const s of STARTERS) {
      const { ok, errors } = validateAgainstSchema(s.query, fixtureSchema);
      expect(ok, `${s.slug}: ${errors.join('; ')}`).toBe(true);
    }
  });

  it('starter slugs are unique', () => {
    const slugs = STARTERS.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('starter labels are non-empty', () => {
    for (const s of STARTERS) {
      expect(s.label.length).toBeGreaterThan(0);
      expect(s.description.length).toBeGreaterThan(0);
    }
  });

  it('legacy path map points to existing starter slugs', () => {
    for (const [legacyPath, slug] of Object.entries(LEGACY_PATH_TO_STARTER)) {
      expect(findStarter(slug), `${legacyPath} → ${slug} not found`).toBeDefined();
    }
  });

  it('covers all four starter groups', () => {
    const groups = new Set(STARTERS.map((s) => s.group));
    expect(groups.has('fmcsa')).toBe(true);
    expect(groups.has('usaspending')).toBe(true);
    expect(groups.has('sam')).toBe(true);
    expect(groups.has('bridge')).toBe(true);
  });
});
