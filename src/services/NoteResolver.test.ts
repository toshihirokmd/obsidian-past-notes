import { NoteResolver } from './NoteResolver';
import { NoteInfo } from '../types';

// Mock vault
function createMockVault(files: Record<string, string>) {
  return {
    getAbstractFileByPath: jest.fn((path: string) => {
      if (path in files) {
        return { path, name: path.split('/').pop(), basename: path.split('/').pop()?.replace('.md', '') };
      }
      return null;
    }),
    cachedRead: jest.fn(async (file: any) => {
      return files[file.path] || '';
    }),
    getMarkdownFiles: jest.fn(() => {
      return Object.keys(files).map(path => ({
        path,
        name: path.split('/').pop(),
        basename: path.split('/').pop()?.replace('.md', ''),
      }));
    }),
  } as any;
}

describe('NoteResolver', () => {
  describe('resolveNotes', () => {
    it('should find existing daily note for a target date', async () => {
      const vault = createMockVault({
        '00-Inbox/2025-03-29.md': '---\ntitle: test\n---\nHello from last year\nLine 2',
      });
      const resolver = new NoteResolver(vault, '00-Inbox');

      const results = await resolver.resolveNotes(
        [{ date: new Date(2025, 2, 29), label: '1 year ago' }],
        4,
      );

      expect(results).toHaveLength(1);
      expect(results[0].exists).toBe(true);
      expect(results[0].path).toBe('00-Inbox/2025-03-29.md');
      expect(results[0].contentPreview).toBe('Hello from last year\nLine 2');
      expect(results[0].label).toBe('1 year ago');
    });

    it('should return exists:false when daily note does not exist', async () => {
      const vault = createMockVault({});
      const resolver = new NoteResolver(vault, '00-Inbox');

      const results = await resolver.resolveNotes(
        [{ date: new Date(2025, 2, 29), label: '1 year ago' }],
        4,
      );

      expect(results).toHaveLength(1);
      expect(results[0].exists).toBe(false);
      expect(results[0].contentPreview).toBe('');
    });

    it('should strip frontmatter from content preview', async () => {
      const vault = createMockVault({
        '00-Inbox/2025-03-29.md': '---\ntitle: foo\ntags: daily\n---\nActual content\nMore content',
      });
      const resolver = new NoteResolver(vault, '00-Inbox');

      const results = await resolver.resolveNotes(
        [{ date: new Date(2025, 2, 29), label: '1 year ago' }],
        4,
      );

      expect(results[0].contentPreview).toBe('Actual content\nMore content');
    });

    it('should limit preview to configured number of lines', async () => {
      const lines = Array.from({ length: 20 }, (_, i) => `Line ${i + 1}`).join('\n');
      const vault = createMockVault({
        '00-Inbox/2025-03-29.md': `---\ntitle: test\n---\n${lines}`,
      });
      const resolver = new NoteResolver(vault, '00-Inbox');

      const results = await resolver.resolveNotes(
        [{ date: new Date(2025, 2, 29), label: 'test' }],
        3,
      );

      expect(results[0].contentPreview).toBe('Line 1\nLine 2\nLine 3');
    });

    it('should handle note with only frontmatter and no body', async () => {
      const vault = createMockVault({
        '00-Inbox/2025-03-29.md': '---\ntitle: empty\n---\n',
      });
      const resolver = new NoteResolver(vault, '00-Inbox');

      const results = await resolver.resolveNotes(
        [{ date: new Date(2025, 2, 29), label: 'test' }],
        4,
      );

      expect(results[0].contentPreview).toBe('');
    });

    it('should resolve multiple dates', async () => {
      const vault = createMockVault({
        '00-Inbox/2025-03-29.md': '---\n---\nContent A',
        '00-Inbox/2025-09-29.md': '---\n---\nContent B',
      });
      const resolver = new NoteResolver(vault, '00-Inbox');

      const results = await resolver.resolveNotes(
        [
          { date: new Date(2025, 2, 29), label: '1 year ago' },
          { date: new Date(2025, 8, 29), label: '6 months ago' },
          { date: new Date(2026, 1, 28), label: '1 month ago' },
        ],
        4,
      );

      expect(results).toHaveLength(3);
      expect(results[0].exists).toBe(true);
      expect(results[1].exists).toBe(true);
      expect(results[2].exists).toBe(false);
    });
  });

  describe('stripFrontmatter', () => {
    it('should remove YAML frontmatter delimited by ---', () => {
      const content = '---\ntitle: test\ntags: foo\n---\nBody text';
      expect(NoteResolver.stripFrontmatter(content)).toBe('Body text');
    });

    it('should return full content if no frontmatter present', () => {
      const content = 'Just plain text\nLine 2';
      expect(NoteResolver.stripFrontmatter(content)).toBe('Just plain text\nLine 2');
    });

    it('should handle empty string', () => {
      expect(NoteResolver.stripFrontmatter('')).toBe('');
    });

    it('should handle frontmatter-only content', () => {
      expect(NoteResolver.stripFrontmatter('---\ntitle: x\n---\n')).toBe('');
    });
  });

  describe('cleanMarkdown', () => {
    it('should remove code blocks', () => {
      const text = 'before\n```js\nconst x = 1;\n```\nafter';
      expect(NoteResolver.cleanMarkdown(text)).toBe('before\n\nafter');
    });

    it('should remove heading markers', () => {
      expect(NoteResolver.cleanMarkdown('## Title')).toBe('Title');
      expect(NoteResolver.cleanMarkdown('##### Deep heading')).toBe('Deep heading');
    });

    it('should convert wiki links to text', () => {
      expect(NoteResolver.cleanMarkdown('See [[My Note]]')).toBe('See My Note');
      expect(NoteResolver.cleanMarkdown('See [[My Note|alias]]')).toBe('See alias');
    });

    it('should remove dataview inline fields', () => {
      expect(NoteResolver.cleanMarkdown('[cost:: 500]')).toBe('');
      expect(NoteResolver.cleanMarkdown('[cat:: food]')).toBe('');
    });

    it('should remove image embeds', () => {
      expect(NoteResolver.cleanMarkdown('![[photo.png]]')).toBe('');
    });

    it('should remove dataview inline queries', () => {
      const result = NoteResolver.cleanMarkdown('Total: `= this.cost`');
      expect(result.trim()).toBe('Total:');
    });

    it('should remove bullet markers', () => {
      expect(NoteResolver.cleanMarkdown('- item 1\n- item 2')).toBe('item 1\nitem 2');
    });
  });

  describe('resolveRandomNotes', () => {
    it('should return the requested number of random daily notes', async () => {
      const vault = createMockVault({
        '00-Inbox/2025-01-01.md': '---\n---\nJan note',
        '00-Inbox/2025-02-15.md': '---\n---\nFeb note',
        '00-Inbox/2025-06-10.md': '---\n---\nJun note',
        '00-Inbox/2025-12-25.md': '---\n---\nDec note',
        '00-Inbox/My Note.md': 'Not a daily note',
      });
      const resolver = new NoteResolver(vault, '00-Inbox');

      const results = await resolver.resolveRandomNotes(2, new Date(2026, 2, 29), 4);

      expect(results).toHaveLength(2);
      results.forEach(note => {
        expect(note.exists).toBe(true);
        expect(note.label).toBe('Random');
      });
    });

    it('should exclude the reference date from random selection', async () => {
      const vault = createMockVault({
        '00-Inbox/2026-03-29.md': '---\n---\nToday',
        '00-Inbox/2025-01-01.md': '---\n---\nOld note',
      });
      const resolver = new NoteResolver(vault, '00-Inbox');

      const results = await resolver.resolveRandomNotes(1, new Date(2026, 2, 29), 4);

      expect(results).toHaveLength(1);
      expect(results[0].path).toBe('00-Inbox/2025-01-01.md');
    });

    it('should return fewer notes if not enough daily notes exist', async () => {
      const vault = createMockVault({
        '00-Inbox/2025-01-01.md': '---\n---\nOnly one',
      });
      const resolver = new NoteResolver(vault, '00-Inbox');

      const results = await resolver.resolveRandomNotes(5, new Date(2026, 2, 29), 4);

      expect(results).toHaveLength(1);
    });

    it('should return empty array when no daily notes exist', async () => {
      const vault = createMockVault({});
      const resolver = new NoteResolver(vault, '00-Inbox');

      const results = await resolver.resolveRandomNotes(3, new Date(2026, 2, 29), 4);

      expect(results).toEqual([]);
    });
  });

  describe('isCurrentFileADailyNote', () => {
    it('should return true for file in daily notes folder with date name', () => {
      expect(NoteResolver.isDailyNote('00-Inbox/2026-03-29.md', '00-Inbox')).toBe(true);
    });

    it('should return false for non-daily-note file', () => {
      expect(NoteResolver.isDailyNote('10-Projects/My Project.md', '00-Inbox')).toBe(false);
    });

    it('should return false for date-named file in wrong folder', () => {
      expect(NoteResolver.isDailyNote('Other/2026-03-29.md', '00-Inbox')).toBe(false);
    });
  });
});
