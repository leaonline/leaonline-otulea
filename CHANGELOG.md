# Changelog

## 1.1.0

### build/deps/core

- Update Meteor to 2.12
- update leaonline:corelib
- update leaonline:ui
- remove unused code

### tts

- use improved tts filtering from updated corelib
- Safari: ignore TTS Error that is raised when TTS has been cancelled by starting another tts

### ui/client

- use renderer loading with options from updated leaonline:ui package
- include `SemikolonBold` font
- implement custom markdown renderers
  - for legal texts
  - for task elements (markdown text, markdown items)
  - with `SemikolonBold` for bold texts
- change load order in `<head>` to improve tti and page load
- preload semikolon font and fix font-display to `swap`
- fix pwa colors (theme, background) to use the correct lea. theme colors

### eval

- fix missing sort statement in `recentCompleted` (relevant for dashboard)

### tests

- improved test coverage
