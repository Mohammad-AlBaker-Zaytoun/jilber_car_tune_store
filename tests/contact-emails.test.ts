import { describe, it, expect } from 'vitest';
import { listContactEmails } from '@/lib/contact';

describe('listContactEmails', () => {
  it('puts the primary address first and keeps the rest in order', () => {
    expect(
      listContactEmails('gilbert@protuningshop.com', [
        'sales@protuningshop.com',
        'contact@protuningshop.com',
      ])
    ).toEqual([
      'gilbert@protuningshop.com',
      'sales@protuningshop.com',
      'contact@protuningshop.com',
    ]);
  });

  /** The settings row ships empty, and the section must simply not render. */
  it('returns nothing when no address is configured', () => {
    expect(listContactEmails('', [])).toEqual([]);
    expect(listContactEmails('')).toEqual([]);
    expect(listContactEmails('   ', ['  '])).toEqual([]);
  });

  it('works with a primary and no extras', () => {
    expect(listContactEmails('gilbert@protuningshop.com')).toEqual(['gilbert@protuningshop.com']);
  });

  /**
   * An extra list still renders even if the primary was never filled in, so
   * adding addresses is never silently swallowed by an empty primary.
   */
  it('lists extras when the primary is blank', () => {
    expect(listContactEmails('', ['sales@protuningshop.com'])).toEqual([
      'sales@protuningshop.com',
    ]);
  });

  it('trims surrounding whitespace', () => {
    expect(listContactEmails('  gilbert@protuningshop.com  ', [' sales@protuningshop.com '])).toEqual(
      ['gilbert@protuningshop.com', 'sales@protuningshop.com']
    );
  });

  it('drops a repeat of the primary rather than listing it twice', () => {
    expect(
      listContactEmails('gilbert@protuningshop.com', [
        'gilbert@protuningshop.com',
        'sales@protuningshop.com',
      ])
    ).toEqual(['gilbert@protuningshop.com', 'sales@protuningshop.com']);
  });

  it('treats a differently-cased duplicate as the same address, keeping the first spelling', () => {
    expect(
      listContactEmails('gilbert@protuningshop.com', ['Gilbert@ProTuningShop.com'])
    ).toEqual(['gilbert@protuningshop.com']);
  });

  it('de-duplicates within the extras', () => {
    expect(
      listContactEmails('', ['sales@protuningshop.com', 'sales@protuningshop.com'])
    ).toEqual(['sales@protuningshop.com']);
  });
});
