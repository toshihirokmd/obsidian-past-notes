import OneYearAgoPlugin from './main';

function createMockApp() {
  return {
    vault: {
      getAbstractFileByPath: jest.fn(),
      getMarkdownFiles: jest.fn().mockReturnValue([]),
      cachedRead: jest.fn(),
    },
    workspace: {
      getActiveFile: jest.fn(),
      getActiveViewOfType: jest.fn().mockReturnValue(null),
      openLinkText: jest.fn(),
      on: jest.fn().mockReturnValue({ unload: jest.fn() }),
    },
    metadataCache: {
      getFileCache: jest.fn(),
      on: jest.fn().mockReturnValue({ unload: jest.fn() }),
    },
  };
}

function createMockManifest() {
  return { id: '1year-ago', name: '1YEAR AGO', version: '0.1.0', author: 'test', minAppVersion: '1.0.0', description: 'test' };
}

describe('OneYearAgoPlugin', () => {
  let plugin: OneYearAgoPlugin;
  let mockApp: any;

  beforeEach(() => {
    mockApp = createMockApp();
    plugin = new OneYearAgoPlugin(mockApp, createMockManifest());
  });

  describe('onload', () => {
    it('should load settings on startup', async () => {
      await plugin.onload();
      expect(plugin.settings).toBeDefined();
      expect(plugin.settings.periods).toHaveLength(4);
    });

    it('should add settings tab', async () => {
      await plugin.onload();
      expect(plugin.addSettingTab).toHaveBeenCalled();
    });
  });

  describe('event registration', () => {
    it('should listen for active-leaf-change events', async () => {
      await plugin.onload();
      const onCalls = mockApp.workspace.on.mock.calls;
      const eventNames = onCalls.map((c: any) => c[0]);
      expect(eventNames).toContain('active-leaf-change');
    });

    it('should listen for metadataCache changed events', async () => {
      await plugin.onload();
      const onCalls = mockApp.metadataCache.on.mock.calls;
      const eventNames = onCalls.map((c: any) => c[0]);
      expect(eventNames).toContain('changed');
    });
  });

  describe('onunload', () => {
    it('should clean up without errors', async () => {
      await plugin.onload();
      expect(() => plugin.onunload()).not.toThrow();
    });
  });
});
