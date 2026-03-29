import { PeriodConfig, DAILY_NOTE_REGEX } from '../types';

export interface TargetDate {
  date: Date;
  label: string;
}

export class DateCalculator {
  /**
   * relative型の期間設定から対象日付を算出（oldest first でソート）
   * random型はスキップ（NoteResolverで別途処理）
   */
  calculateTargetDates(referenceDate: Date, periods: PeriodConfig[]): TargetDate[] {
    return periods
      .filter(p => p.enabled && p.type === 'relative')
      .map(p => ({
        date: this.subtractPeriod(referenceDate, p),
        label: this.formatLabel(p),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private subtractPeriod(date: Date, period: PeriodConfig): Date {
    const originalDay = date.getDate();
    const result = new Date(date.getTime());

    switch (period.unit) {
      case 'year':
        result.setFullYear(result.getFullYear() - period.amount);
        // Clamp: if day rolled over (e.g. Feb 29 -> Mar 1), go to last day of target month
        if (result.getDate() !== originalDay) {
          result.setDate(0); // last day of previous month
        }
        break;
      case 'month':
        result.setMonth(result.getMonth() - period.amount);
        if (result.getDate() !== originalDay) {
          result.setDate(0);
        }
        break;
      case 'week':
        result.setDate(result.getDate() - period.amount * 7);
        break;
      case 'day':
        result.setDate(result.getDate() - period.amount);
        break;
    }

    return result;
  }

  /**
   * ファイル名からYYYY-MM-DD形式の日付をパース
   */
  parseDateFromFilename(filename: string): Date | null {
    const match = filename.match(DAILY_NOTE_REGEX);
    if (!match) return null;

    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);

    // Validate
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;

    const date = new Date(year, month - 1, day);
    // Check that the date didn't roll over (e.g. Feb 30 -> Mar 2)
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return null;
    }

    return date;
  }

  /**
   * DateをYYYY-MM-DD形式の文字列に変換
   */
  formatDateToFilename(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * 期間設定から人間可読なラベルを生成
   */
  formatLabel(period: PeriodConfig): string {
    if (period.type === 'random') return 'Random';

    const unitLabel = period.amount === 1 ? period.unit : `${period.unit}s`;
    return `${period.amount} ${unitLabel} ago`;
  }

  /**
   * 有効なrandom型期間の数を返す
   */
  getRandomPeriodCount(periods: PeriodConfig[]): number {
    return periods.filter(p => p.enabled && p.type === 'random').length;
  }
}
