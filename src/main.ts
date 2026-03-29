import { Plugin, MarkdownView } from 'obsidian';
import { PluginSettings, CSS_CLASSES, RENDER_DELAY_MS, RENDER_RETRY_DELAY_MS } from './types';
import { DateCalculator } from './services/DateCalculator';
import { NoteResolver } from './services/NoteResolver';
import { CardRenderer } from './views/CardRenderer';
import { OneYearAgoSettingsTab, loadSettings } from './views/SettingsTab';

export default class OneYearAgoPlugin extends Plugin {
  settings!: PluginSettings;

  private dateCalculator = new DateCalculator();
  private cardRenderer = new CardRenderer();
  private renderTimer: ReturnType<typeof setTimeout> | null = null;

  async onload() {
    this.settings = await loadSettings(this);
    this.addSettingTab(new OneYearAgoSettingsTab(this.app, this));

    this.registerEvent(
      this.app.workspace.on('active-leaf-change', () => {
        this.scheduleRender();
      })
    );

    this.registerEvent(
      this.app.metadataCache.on('changed', (file) => {
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile && file.path === activeFile.path) {
          this.scheduleRender();
        }
      })
    );
  }

  private scheduleRender() {
    if (this.renderTimer) clearTimeout(this.renderTimer);
    this.renderTimer = setTimeout(() => {
      this.renderTimer = null;
      this.renderCards();
      // Obsidianのレイアウト再計算後にpadding再上書き
      setTimeout(() => this.renderCards(), RENDER_RETRY_DELAY_MS);
    }, RENDER_DELAY_MS);
  }

  /** ビュー内のフッターコンテナを取得または作成 */
  private findOrCreateFooter(parent: HTMLElement): HTMLElement {
    let footer = parent.querySelector('.' + CSS_CLASSES.footer) as HTMLElement | null;
    if (!footer) {
      footer = document.createElement('div');
      footer.classList.add(CSS_CLASSES.footer);
      parent.appendChild(footer);
    }
    return footer;
  }

  /** sizer/preview-view の余白を除去 */
  private clearPadding(sizer: HTMLElement) {
    sizer.style.minHeight = '0px';
    sizer.style.paddingBottom = '0px';
    const previewView = sizer.parentElement;
    if (previewView) {
      previewView.style.paddingBottom = '0px';
    }
  }

  private async renderCards() {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) return;
    if (!NoteResolver.isDailyNote(activeFile.path, this.settings.dailyNotesFolder)) return;

    const noteDate = this.dateCalculator.parseDateFromFilename(activeFile.name);
    if (!noteDate) return;

    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return;

    const resolver = new NoteResolver(this.app.vault, this.settings.dailyNotesFolder);
    const dateTargets = this.dateCalculator.calculateTargetDates(noteDate, this.settings.periods);
    const relativeNotes = await resolver.resolveNotes(dateTargets, this.settings.previewLines);

    const randomCount = this.dateCalculator.getRandomPeriodCount(this.settings.periods);
    const randomNotes = randomCount > 0
      ? await resolver.resolveRandomNotes(randomCount, noteDate, this.settings.previewLines)
      : [];

    const allNotes = [...relativeNotes, ...randomNotes];
    const containerEl = view.containerEl;

    // Reading view
    const readingSizer = containerEl.querySelector('.markdown-preview-sizer') as HTMLElement | null;
    if (readingSizer) {
      this.clearPadding(readingSizer);
      const footer = this.findOrCreateFooter(readingSizer);
      footer.innerHTML = '';
      this.cardRenderer.render(footer, allNotes, this.settings, (path) => {
        this.app.workspace.openLinkText(path, '', false);
      });
    }

    // Live Preview
    const cmSizer = containerEl.querySelector('.markdown-source-view .cm-sizer') as HTMLElement | null;
    if (cmSizer) {
      const footer = this.findOrCreateFooter(cmSizer);
      footer.innerHTML = '';
      this.cardRenderer.render(footer, allNotes, this.settings, (path) => {
        this.app.workspace.openLinkText(path, '', false);
      });
    }
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  onunload() {
    if (this.renderTimer) clearTimeout(this.renderTimer);
    document.querySelectorAll('.' + CSS_CLASSES.footer).forEach(el => el.remove());
  }
}
