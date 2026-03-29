import { jest } from '@jest/globals';

jest.mock('obsidian', () => ({
  Plugin: class MockPlugin {
    app: any;
    manifest: any;
    addRibbonIcon = jest.fn();
    addCommand = jest.fn();
    addSettingTab = jest.fn();
    registerMarkdownPostProcessor = jest.fn();
    registerEvent = jest.fn();
    loadData = jest.fn<() => Promise<any>>().mockResolvedValue(null);
    saveData = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);

    constructor(app: any, manifest: any) {
      this.app = app;
      this.manifest = manifest;
    }
    async onload() {}
    onunload() {}
  },
  PluginSettingTab: class MockPluginSettingTab {
    app: any;
    plugin: any;
    containerEl: any;
    constructor(app: any, plugin: any) {
      this.app = app;
      this.plugin = plugin;
      this.containerEl = document.createElement('div');
    }
    display() {}
  },
  Setting: class MockSetting {
    settingEl: any;
    constructor(containerEl: any) { this.settingEl = containerEl; }
    setName() { return this; }
    setDesc() { return this; }
    addText(cb: any) { cb({ setValue: jest.fn().mockReturnThis(), setPlaceholder: jest.fn().mockReturnThis(), onChange: jest.fn().mockReturnThis() }); return this; }
    addToggle(cb: any) { cb({ setValue: jest.fn().mockReturnThis(), onChange: jest.fn().mockReturnThis() }); return this; }
    addDropdown(cb: any) { cb({ addOption: jest.fn().mockReturnThis(), setValue: jest.fn().mockReturnThis(), onChange: jest.fn().mockReturnThis() }); return this; }
    addButton(cb: any) { cb({ setButtonText: jest.fn().mockReturnThis(), setCta: jest.fn().mockReturnThis(), onClick: jest.fn().mockReturnThis() }); return this; }
  },
  TFile: class {
    path = '';
    name = '';
    basename = '';
  },
}), { virtual: true });

global.app = {
  vault: {
    adapter: {
      read: jest.fn(),
      list: jest.fn(),
      exists: jest.fn(),
    },
    getAbstractFileByPath: jest.fn(),
    getMarkdownFiles: jest.fn().mockReturnValue([]),
    cachedRead: jest.fn(),
  },
  workspace: {
    getActiveFile: jest.fn(),
    openLinkText: jest.fn(),
    on: jest.fn(),
  },
  metadataCache: {
    getFileCache: jest.fn(),
    on: jest.fn(),
  },
} as any;
