import { CardRenderer } from './CardRenderer';
import { NoteInfo, PluginSettings, DEFAULT_SETTINGS } from '../types';

function makeNote(overrides: Partial<NoteInfo> = {}): NoteInfo {
  return {
    date: new Date(2025, 2, 29),
    path: '00-Inbox/2025-03-29.md',
    label: '1 year ago',
    contentPreview: 'Hello from last year\nLine 2',
    exists: true,
    ...overrides,
  };
}

function makeSettings(overrides: Partial<PluginSettings> = {}): PluginSettings {
  return { ...DEFAULT_SETTINGS, ...overrides };
}

describe('CardRenderer', () => {
  let container: HTMLElement;
  let renderer: CardRenderer;
  let onCardClick: jest.Mock;

  beforeEach(() => {
    container = document.createElement('div');
    renderer = new CardRenderer();
    onCardClick = jest.fn();
  });

  describe('render', () => {
    it('should create a section wrapper with class "oneyear-ago-section"', () => {
      renderer.render(container, [makeNote()], makeSettings(), onCardClick);
      expect(container.querySelector('.oneyear-ago-section')).not.toBeNull();
    });

    it('should create a section header', () => {
      renderer.render(container, [makeNote()], makeSettings(), onCardClick);
      const header = container.querySelector('.oneyear-ago-header');
      expect(header).not.toBeNull();
      expect(header!.textContent).toBe('Past Notes');
    });

    it('should create a card grid container', () => {
      renderer.render(container, [makeNote()], makeSettings(), onCardClick);
      expect(container.querySelector('.oneyear-ago-grid')).not.toBeNull();
    });

    it('should render one card per existing NoteInfo', () => {
      const notes = [
        makeNote(),
        makeNote({ path: '00-Inbox/2025-09-29.md', label: '6 months ago' }),
        makeNote({ exists: false }),
      ];
      renderer.render(container, notes, makeSettings(), onCardClick);
      const cards = container.querySelectorAll('.oneyear-ago-card');
      expect(cards).toHaveLength(2);
    });

    it('should not render cards for non-existing notes', () => {
      renderer.render(container, [makeNote({ exists: false })], makeSettings(), onCardClick);
      expect(container.querySelectorAll('.oneyear-ago-card')).toHaveLength(0);
    });

    it('should display the period label on each card', () => {
      renderer.render(container, [makeNote({ label: '6 months ago' })], makeSettings(), onCardClick);
      const label = container.querySelector('.oneyear-ago-label');
      expect(label!.textContent).toBe('6 months ago');
    });

    it('should display the date on each card', () => {
      renderer.render(container, [makeNote()], makeSettings(), onCardClick);
      const dateEl = container.querySelector('.oneyear-ago-date');
      expect(dateEl!.textContent).toBe('2025-03-29');
    });

    it('should display content preview when showPreview is true', () => {
      renderer.render(container, [makeNote()], makeSettings({ showPreview: true }), onCardClick);
      const preview = container.querySelector('.oneyear-ago-preview');
      expect(preview).not.toBeNull();
      expect(preview!.textContent).toBe('Hello from last year\nLine 2');
    });

    it('should hide content preview when showPreview is false', () => {
      renderer.render(container, [makeNote()], makeSettings({ showPreview: false }), onCardClick);
      const preview = container.querySelector('.oneyear-ago-preview');
      expect(preview).toBeNull();
    });

    it('should make each card clickable', () => {
      renderer.render(container, [makeNote()], makeSettings(), onCardClick);
      const card = container.querySelector('.oneyear-ago-card') as HTMLElement;
      card.click();
      expect(onCardClick).toHaveBeenCalledWith('00-Inbox/2025-03-29.md');
    });

    it('should render nothing when all notes are non-existing', () => {
      renderer.render(container, [makeNote({ exists: false })], makeSettings(), onCardClick);
      expect(container.querySelector('.oneyear-ago-section')).toBeNull();
    });

    it('should render nothing when NoteInfo array is empty', () => {
      renderer.render(container, [], makeSettings(), onCardClick);
      expect(container.querySelector('.oneyear-ago-section')).toBeNull();
    });

    it('should apply custom cardWidth and cardHeight as CSS variables', () => {
      renderer.render(container, [makeNote()], makeSettings({ cardWidth: 250, cardHeight: 180 }), onCardClick);
      const grid = container.querySelector('.oneyear-ago-grid') as HTMLElement;
      expect(grid.style.getPropertyValue('--card-width')).toBe('250px');
      expect(grid.style.getPropertyValue('--card-height')).toBe('180px');
    });
  });

  describe('card structure', () => {
    beforeEach(() => {
      renderer.render(container, [makeNote()], makeSettings(), onCardClick);
    });

    it('should have card element with class "oneyear-ago-card"', () => {
      expect(container.querySelector('.oneyear-ago-card')).not.toBeNull();
    });

    it('should have label element with class "oneyear-ago-label"', () => {
      expect(container.querySelector('.oneyear-ago-label')).not.toBeNull();
    });

    it('should have date element with class "oneyear-ago-date"', () => {
      expect(container.querySelector('.oneyear-ago-date')).not.toBeNull();
    });

    it('should have preview element with class "oneyear-ago-preview"', () => {
      expect(container.querySelector('.oneyear-ago-preview')).not.toBeNull();
    });
  });
});
