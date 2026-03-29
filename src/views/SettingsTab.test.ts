import { DEFAULT_SETTINGS, PluginSettings } from '../types';
import { loadSettings, mergeSettings } from './SettingsTab';

describe('SettingsTab', () => {
  describe('DEFAULT_SETTINGS', () => {
    it('should have 4 default periods (1yr, 6mo, 1mo, random)', () => {
      expect(DEFAULT_SETTINGS.periods).toHaveLength(4);
      expect(DEFAULT_SETTINGS.periods[0]).toEqual({ type: 'relative', amount: 1, unit: 'year', enabled: true });
      expect(DEFAULT_SETTINGS.periods[1]).toEqual({ type: 'relative', amount: 6, unit: 'month', enabled: true });
      expect(DEFAULT_SETTINGS.periods[2]).toEqual({ type: 'relative', amount: 1, unit: 'month', enabled: true });
      expect(DEFAULT_SETTINGS.periods[3]).toEqual({ type: 'random', amount: 0, unit: 'day', enabled: true });
    });

    it('should have default cardWidth of 200', () => {
      expect(DEFAULT_SETTINGS.cardWidth).toBe(200);
    });

    it('should have default cardHeight of 150', () => {
      expect(DEFAULT_SETTINGS.cardHeight).toBe(150);
    });

    it('should have showPreview true by default', () => {
      expect(DEFAULT_SETTINGS.showPreview).toBe(true);
    });

    it('should have previewLines of 4 by default', () => {
      expect(DEFAULT_SETTINGS.previewLines).toBe(4);
    });

    it('should have dailyNotesFolder of "00-Inbox"', () => {
      expect(DEFAULT_SETTINGS.dailyNotesFolder).toBe('00-Inbox');
    });
  });

  describe('mergeSettings', () => {
    it('should return defaults when saved data is null', () => {
      const result = mergeSettings(null);
      expect(result).toEqual(DEFAULT_SETTINGS);
    });

    it('should merge saved settings with defaults', () => {
      const saved = { cardWidth: 300 };
      const result = mergeSettings(saved);
      expect(result.cardWidth).toBe(300);
      expect(result.cardHeight).toBe(DEFAULT_SETTINGS.cardHeight); // default
      expect(result.periods).toEqual(DEFAULT_SETTINGS.periods); // default
    });

    it('should preserve saved periods if present', () => {
      const saved = {
        periods: [{ type: 'relative' as const, amount: 2, unit: 'year' as const, enabled: true }],
      };
      const result = mergeSettings(saved);
      expect(result.periods).toHaveLength(1);
      expect(result.periods[0].amount).toBe(2);
    });
  });

  describe('loadSettings', () => {
    it('should call loadData and merge with defaults', async () => {
      const mockPlugin = {
        loadData: jest.fn().mockResolvedValue({ cardWidth: 250 }),
      };
      const result = await loadSettings(mockPlugin as any);
      expect(mockPlugin.loadData).toHaveBeenCalled();
      expect(result.cardWidth).toBe(250);
      expect(result.showPreview).toBe(true);
    });

    it('should handle null loadData result', async () => {
      const mockPlugin = {
        loadData: jest.fn().mockResolvedValue(null),
      };
      const result = await loadSettings(mockPlugin as any);
      expect(result).toEqual(DEFAULT_SETTINGS);
    });
  });
});
