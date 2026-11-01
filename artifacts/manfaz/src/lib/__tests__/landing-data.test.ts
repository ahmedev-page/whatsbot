import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BOT_PILLARS,
  PLATFORM_SERVICES,
  filterServicesByCategory,
  resolveStudioPreviewState,
} from '../landing-data.ts';

describe('landing-data pure logic', () => {
  it('returns all 12 platform services when category is all', () => {
    const all = filterServicesByCategory('all');
    assert.equal(all.length, 12);
    assert.equal(PLATFORM_SERVICES.length, 12);
  });

  it('filters platform services accurately by category', () => {
    const presence = filterServicesByCategory('presence');
    const commerce = filterServicesByCategory('commerce');
    const engagement = filterServicesByCategory('engagement');

    assert.equal(presence.length, 3);
    assert.equal(commerce.length, 5);
    assert.equal(engagement.length, 4);
    assert.ok(presence.every((s) => s.category === 'presence'));
    assert.ok(commerce.every((s) => s.category === 'commerce'));
    assert.ok(engagement.every((s) => s.category === 'engagement'));
  });

  it('resolves studio preview state with custom title and fallback default title', () => {
    const defaultState = resolveStudioPreviewState('store', '   ', '#2563EB', 'cinematic');
    assert.equal(defaultState.displayTitle, 'دار أروما للقهوة المختصة');
    assert.equal(defaultState.isDarkCanvas, true);
    assert.equal(defaultState.theme.hex, '#2563EB');

    const customState = resolveStudioPreviewState(
      'booking',
      'عيادات النخبة الرقمية',
      '#0D9488',
      'modern',
    );
    assert.equal(customState.displayTitle, 'عيادات النخبة الرقمية');
    assert.equal(customState.preset.id, 'booking');
    assert.equal(customState.isDarkCanvas, false);
    assert.equal(customState.theme.hex, '#0D9488');
  });

  it('falls back safely when unknown preset or color hex is passed', () => {
    const fallbackState = resolveStudioPreviewState('unknown_key', '', '#000000', 'classic');
    assert.equal(fallbackState.preset.id, 'store');
    assert.equal(fallbackState.theme.hex, '#2563EB');
  });

  it('restricts WhatsApp assistant strictly to the 3 approved capabilities', () => {
    assert.equal(BOT_PILLARS.length, 3);
    assert.deepEqual(
      BOT_PILLARS.map((p) => p.id),
      ['auth', 'edit', 'analytics'],
    );
  });

  it('ensures no pale yellow accents cause yellow-on-yellow or low contrast on light surfaces', () => {
    const bannedPaleYellows = new Set(['#EAB308', '#FACC15', '#FBBF24', '#F59E0B', '#FEF08A']);
    for (const service of PLATFORM_SERVICES) {
      assert.equal(
        bannedPaleYellows.has(service.accentFrom.toUpperCase()),
        false,
        `Service ${service.id} must not use pale yellow accentFrom ${service.accentFrom}`,
      );
      assert.equal(
        bannedPaleYellows.has(service.accentTo.toUpperCase()),
        false,
        `Service ${service.id} must not use pale yellow accentTo ${service.accentTo}`,
      );
    }
  });
});

