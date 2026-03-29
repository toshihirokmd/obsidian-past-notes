# Past Notes

Obsidian plugin that displays past daily notes as cards at the bottom of your current daily note.

![](https://img.shields.io/badge/Obsidian-Plugin-purple)

## Features

- **Past note cards** — Automatically shows cards for daily notes from configurable time periods (default: 1 year ago, 6 months ago, 1 month ago)
- **Random notes** — Optionally displays random past daily notes for serendipitous rediscovery
- **Content preview** — Each card shows a clean text preview of the note (markdown syntax stripped)
- **Configurable** — Add/remove periods, adjust card size, toggle previews
- **Click to navigate** — Click any card to jump to that past note
- **Theme-aware** — Works with both light and dark themes

## Installation

### Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](../../releases/latest)
2. Create a folder `your-vault/.obsidian/plugins/past-notes/`
3. Copy the downloaded files into the folder
4. Restart Obsidian and enable the plugin in Settings → Community plugins

## Settings

| Setting | Description | Default |
|---------|-------------|---------|
| Daily Notes Folder | Folder where daily notes are stored | `00-Inbox` |
| Card Width | Width of each card (px) | `200` |
| Card Height | Max height of each card (px) | `150` |
| Show Preview | Display content preview in cards | `true` |
| Preview Lines | Number of preview lines | `4` |

### Periods

Add, remove, or toggle display periods:

- **Relative periods** — e.g., "1 year ago", "6 months ago", "2 weeks ago"
- **Random** — Shows a random past daily note

## Development

```bash
# Install dependencies
npm install

# Development (watch mode)
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Testing

The plugin is built with TDD (Test-Driven Development). Run the full test suite:

```bash
npm test           # Run all tests
npm run test:watch # Watch mode
npm run test:coverage # With coverage report
```

## License

MIT
