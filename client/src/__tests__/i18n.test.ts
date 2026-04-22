import { describe, it, expect, beforeEach } from 'vitest';
import i18n from '../i18n';

describe('i18n Configuration', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('should have both EN and PT languages configured', () => {
    expect(i18n.options.resources).toBeDefined();
    expect(i18n.options.resources?.en).toBeDefined();
    expect(i18n.options.resources?.pt).toBeDefined();
  });

  it('should translate common.loading to English', async () => {
    await i18n.changeLanguage('en');
    const text = i18n.t('common.loading');
    expect(text).toContain('Loading');
  });

  it('should translate common.loading to Portuguese', async () => {
    await i18n.changeLanguage('pt');
    const text = i18n.t('common.loading');
    expect(text).toContain('Carregando');
  });

  it('should translate pages.home.title to English', async () => {
    await i18n.changeLanguage('en');
    const text = i18n.t('pages.home.title');
    expect(text).toBe('Ctrl Alt News');
  });

  it('should translate pages.home.title to Portuguese', async () => {
    await i18n.changeLanguage('pt');
    const text = i18n.t('pages.home.title');
    expect(text).toBe('Ctrl Alt News');
  });

  it('should have fallback language as EN', () => {
    expect(i18n.options.fallbackLng).toEqual(['en']);
  });

  it('should change language when changeLanguage is called', async () => {
    await i18n.changeLanguage('pt');
    expect(i18n.language).toBe('pt');
    await i18n.changeLanguage('en');
    expect(i18n.language).toBe('en');
  });

  it('should return missing key placeholder when key not found', () => {
    const text = i18n.t('nonexistent.key');
    // i18next returns the key itself as fallback
    expect(text).toBe('nonexistent.key');
  });
});
