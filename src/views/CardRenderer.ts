import { NoteInfo, PluginSettings, CSS_CLASSES } from '../types';
import { DateCalculator } from '../services/DateCalculator';

const dateCalc = new DateCalculator();

export class CardRenderer {
  render(
    container: HTMLElement,
    notes: NoteInfo[],
    settings: PluginSettings,
    onCardClick: (path: string) => void,
  ): void {
    const existingNotes = notes.filter(n => n.exists);
    if (existingNotes.length === 0) return;

    const section = document.createElement('div');
    section.classList.add(CSS_CLASSES.section);

    const header = document.createElement('h4');
    header.classList.add(CSS_CLASSES.header);
    header.textContent = 'Past Notes';
    section.appendChild(header);

    const grid = document.createElement('div');
    grid.classList.add(CSS_CLASSES.grid);
    grid.style.setProperty('--card-width', `${settings.cardWidth}px`);
    grid.style.setProperty('--card-height', `${settings.cardHeight}px`);
    section.appendChild(grid);

    for (const note of existingNotes) {
      grid.appendChild(this.createCard(note, settings, onCardClick));
    }

    container.appendChild(section);
  }

  private createCard(note: NoteInfo, settings: PluginSettings, onCardClick: (path: string) => void): HTMLElement {
    const card = document.createElement('div');
    card.classList.add(CSS_CLASSES.card);
    card.addEventListener('click', () => onCardClick(note.path));

    const label = document.createElement('div');
    label.classList.add(CSS_CLASSES.label);
    label.textContent = note.label;
    card.appendChild(label);

    const dateEl = document.createElement('div');
    dateEl.classList.add(CSS_CLASSES.date);
    dateEl.textContent = dateCalc.formatDateToFilename(note.date);
    card.appendChild(dateEl);

    if (settings.showPreview && note.contentPreview) {
      const preview = document.createElement('div');
      preview.classList.add(CSS_CLASSES.preview);
      preview.textContent = note.contentPreview;
      card.appendChild(preview);
    }

    return card;
  }
}
