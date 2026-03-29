/** デイリーノートのファイル名パターン (YYYY-MM-DD.md) */
export const DAILY_NOTE_REGEX = /(\d{4})-(\d{2})-(\d{2})\.md$/;

/** デイリーノートのファイル名判定（日付部分のみ） */
export const DAILY_NOTE_NAME_REGEX = /^\d{4}-\d{2}-\d{2}\.md$/;

/** レンダリング遅延 (ms) */
export const RENDER_DELAY_MS = 500;
export const RENDER_RETRY_DELAY_MS = 1500;

/** CSS クラス名 */
export const CSS_CLASSES = {
  footer: 'oneyear-ago-footer',
  section: 'oneyear-ago-section',
  header: 'oneyear-ago-header',
  grid: 'oneyear-ago-grid',
  card: 'oneyear-ago-card',
  label: 'oneyear-ago-label',
  date: 'oneyear-ago-date',
  preview: 'oneyear-ago-preview',
} as const;

export interface PeriodConfig {
  /** 'relative' = N日/月/年前, 'random' = ランダムな過去ノート */
  type: 'relative' | 'random';
  /** relative時の数量 (例: 1, 6) / random時は無視 */
  amount: number;
  /** relative時の単位 / random時は無視 */
  unit: 'year' | 'month' | 'week' | 'day';
  enabled: boolean;
}

export interface PluginSettings {
  periods: PeriodConfig[];
  cardWidth: number;
  cardHeight: number;
  showPreview: boolean;
  previewLines: number;
  dailyNotesFolder: string;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  periods: [
    { type: 'relative', amount: 1, unit: 'year', enabled: true },
    { type: 'relative', amount: 6, unit: 'month', enabled: true },
    { type: 'relative', amount: 1, unit: 'month', enabled: true },
    { type: 'random', amount: 0, unit: 'day', enabled: true },
  ],
  cardWidth: 200,
  cardHeight: 150,
  showPreview: true,
  previewLines: 4,
  dailyNotesFolder: '',
};

/** デイリーノートのパスを構築 */
export function buildDailyNotePath(folder: string, filename: string): string {
  return folder ? `${folder}/${filename}.md` : `${filename}.md`;
}

export interface NoteInfo {
  date: Date;
  path: string;
  label: string;
  contentPreview: string;
  exists: boolean;
}
