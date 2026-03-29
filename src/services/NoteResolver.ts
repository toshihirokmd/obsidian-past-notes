import { NoteInfo, DAILY_NOTE_NAME_REGEX, buildDailyNotePath } from '../types';
import { DateCalculator, TargetDate } from './DateCalculator';

const dateCalc = new DateCalculator();

export class NoteResolver {
  constructor(
    private vault: any,
    private dailyNotesFolder: string = '00-Inbox',
  ) {}

  async resolveNotes(targets: TargetDate[], previewLines: number): Promise<NoteInfo[]> {
    const results: NoteInfo[] = [];

    for (const target of targets) {
      const filename = dateCalc.formatDateToFilename(target.date);
      const path = buildDailyNotePath(this.dailyNotesFolder, filename);
      const file = this.vault.getAbstractFileByPath(path);

      if (file) {
        const content = await this.vault.cachedRead(file);
        const preview = NoteResolver.extractPreview(content, previewLines);
        results.push({ date: target.date, path, label: target.label, contentPreview: preview, exists: true });
      } else {
        results.push({ date: target.date, path, label: target.label, contentPreview: '', exists: false });
      }
    }

    return results;
  }

  async resolveRandomNotes(count: number, referenceDate: Date, previewLines: number): Promise<NoteInfo[]> {
    const refFilename = dateCalc.formatDateToFilename(referenceDate);
    const refPath = buildDailyNotePath(this.dailyNotesFolder, refFilename);

    const allFiles = this.vault.getMarkdownFiles() as any[];
    const dailyNoteFiles = allFiles.filter((f: any) => {
      if (this.dailyNotesFolder) {
        if (!f.path.startsWith(this.dailyNotesFolder + '/')) return false;
      } else {
        if (f.path.includes('/')) return false;
      }
      if (f.path === refPath) return false;
      return DAILY_NOTE_NAME_REGEX.test(f.name || '');
    });

    if (dailyNoteFiles.length === 0) return [];

    const selected = this.shuffle([...dailyNoteFiles])
      .slice(0, Math.min(count, dailyNoteFiles.length));

    const results: NoteInfo[] = [];
    for (const file of selected) {
      const content = await this.vault.cachedRead(file);
      const preview = NoteResolver.extractPreview(content, previewLines);
      const date = dateCalc.parseDateFromFilename(file.name) || new Date();
      results.push({ date, path: file.path, label: 'Random', contentPreview: preview, exists: true });
    }

    return results;
  }

  private shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /** frontmatter除去 → Markdownクリーニング → 行数制限 を一括実行 */
  static extractPreview(content: string, maxLines: number): string {
    const body = NoteResolver.stripFrontmatter(content);
    return NoteResolver.truncateLines(body, maxLines);
  }

  static stripFrontmatter(content: string): string {
    if (!content) return '';
    const normalized = content.replace(/\r\n/g, '\n');
    const match = normalized.match(/^---\n[\s\S]*?\n---\n?([\s\S]*)$/);
    return match ? match[1].trim() : normalized.trim();
  }

  static cleanMarkdown(text: string): string {
    if (!text) return '';
    return text
      .replace(/```[\s\S]*?```/g, '')           // コードブロック
      .replace(/!\[\[[^\]]*\]\]/g, '')           // 画像埋め込み ![[...]]
      .replace(/^#{1,6}\s+/gm, '')               // 見出し記号
      .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, link, alias) => alias || link) // wikiリンク
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')   // Markdownリンク
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')   // 太字・イタリック
      .replace(/`=[^`]*`/g, '')                   // Dataviewインラインクエリ
      .replace(/`([^`]+)`/g, '$1')                // インラインコード
      .replace(/\[[\w]+::\s*[^\]]*\]/g, '')       // Dataviewフィールド
      .replace(/^[-*+]\s+\[.\]\s+/gm, '')         // タスクリスト
      .replace(/^[-*+]\s+/gm, '');                 // 箇条書き
  }

  static truncateLines(text: string, maxLines: number): string {
    if (!text) return '';
    const cleaned = NoteResolver.cleanMarkdown(text);
    return cleaned.split('\n').map(l => l.trim()).filter(l => l !== '').slice(0, maxLines).join('\n');
  }

  static isDailyNote(filePath: string, dailyNotesFolder: string): boolean {
    if (dailyNotesFolder) {
      if (!filePath.startsWith(dailyNotesFolder + '/')) return false;
    } else {
      // ルート直下: サブフォルダ内のファイルは除外
      if (filePath.includes('/')) return false;
    }
    const filename = filePath.split('/').pop() || filePath;
    return DAILY_NOTE_NAME_REGEX.test(filename);
  }
}
