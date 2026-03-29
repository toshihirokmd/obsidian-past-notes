import { PluginSettingTab, Setting, Plugin } from 'obsidian';
import { PluginSettings, PeriodConfig, DEFAULT_SETTINGS } from '../types';

export function mergeSettings(saved: any): PluginSettings {
  if (!saved) return { ...DEFAULT_SETTINGS, periods: [...DEFAULT_SETTINGS.periods] };
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    periods: saved.periods ? [...saved.periods] : [...DEFAULT_SETTINGS.periods],
  };
}

export async function loadSettings(plugin: Plugin): Promise<PluginSettings> {
  const data = await plugin.loadData();
  return mergeSettings(data);
}

export class OneYearAgoSettingsTab extends PluginSettingTab {
  plugin: any;
  settings: PluginSettings;

  constructor(app: any, plugin: any) {
    super(app, plugin);
    this.plugin = plugin;
    this.settings = plugin.settings;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'Past Notes Settings' });

    this.addFolderSetting(containerEl);
    this.addCardDimensionSettings(containerEl);
    this.addPreviewSettings(containerEl);
    this.addPeriodSettings(containerEl);
  }

  private addFolderSetting(containerEl: HTMLElement) {
    new Setting(containerEl)
      .setName('Daily Notes Folder')
      .setDesc('デイリーノートが保存されているフォルダ')
      .addText(text => text
        .setPlaceholder(DEFAULT_SETTINGS.dailyNotesFolder)
        .setValue(this.settings.dailyNotesFolder)
        .onChange(async (value: string) => {
          this.settings.dailyNotesFolder = value;
          await this.plugin.saveSettings();
        }));
  }

  private addCardDimensionSettings(containerEl: HTMLElement) {
    this.addNumberSetting(containerEl, 'Card Width (px)', 'カードの幅',
      this.settings.cardWidth, DEFAULT_SETTINGS.cardWidth,
      (v) => { this.settings.cardWidth = v; });

    this.addNumberSetting(containerEl, 'Card Height (px)', 'カードの高さ',
      this.settings.cardHeight, DEFAULT_SETTINGS.cardHeight,
      (v) => { this.settings.cardHeight = v; });
  }

  private addPreviewSettings(containerEl: HTMLElement) {
    new Setting(containerEl)
      .setName('Show Preview')
      .setDesc('カードにノート内容のプレビューを表示する')
      .addToggle(toggle => toggle
        .setValue(this.settings.showPreview)
        .onChange(async (value: boolean) => {
          this.settings.showPreview = value;
          await this.plugin.saveSettings();
        }));

    this.addNumberSetting(containerEl, 'Preview Lines', 'プレビューに表示する行数',
      this.settings.previewLines, DEFAULT_SETTINGS.previewLines,
      (v) => { this.settings.previewLines = v; });
  }

  private addPeriodSettings(containerEl: HTMLElement) {
    containerEl.createEl('h3', { text: 'Periods（表示する期間）' });

    this.settings.periods.forEach((period, index) => {
      const name = period.type === 'random'
        ? `#${index + 1}: Random`
        : `#${index + 1}: ${period.amount} ${period.unit}(s) ago`;
      const desc = period.type === 'random'
        ? 'ランダムな過去ノートを表示'
        : '指定した期間前のノートを表示';

      new Setting(containerEl)
        .setName(name)
        .setDesc(desc)
        .addToggle(toggle => toggle
          .setValue(period.enabled)
          .onChange(async (value: boolean) => {
            this.settings.periods[index].enabled = value;
            await this.plugin.saveSettings();
          }))
        .addButton(btn => btn
          .setButtonText('Delete')
          .onClick(async () => {
            this.settings.periods.splice(index, 1);
            await this.plugin.saveSettings();
            this.display();
          }));
    });

    this.addPeriodButton(containerEl, 'Add Relative Period', '日付指定の期間を追加', '+ Add',
      { type: 'relative', amount: 1, unit: 'year', enabled: true });

    this.addPeriodButton(containerEl, 'Add Random', 'ランダムノート枠を追加', '+ Random',
      { type: 'random', amount: 0, unit: 'day', enabled: true });
  }

  private addNumberSetting(
    containerEl: HTMLElement, name: string, desc: string,
    currentValue: number, defaultValue: number,
    setter: (v: number) => void,
  ) {
    new Setting(containerEl)
      .setName(name)
      .setDesc(desc)
      .addText(text => text
        .setValue(String(currentValue))
        .onChange(async (value: string) => {
          setter(parseInt(value, 10) || defaultValue);
          await this.plugin.saveSettings();
        }));
  }

  private addPeriodButton(
    containerEl: HTMLElement, name: string, desc: string,
    buttonText: string, newPeriod: PeriodConfig,
  ) {
    new Setting(containerEl)
      .setName(name)
      .setDesc(desc)
      .addButton(btn => btn
        .setButtonText(buttonText)
        .setCta()
        .onClick(async () => {
          this.settings.periods.push(newPeriod);
          await this.plugin.saveSettings();
          this.display();
        }));
  }
}
