# New Tab to the Right

Browser extension that adds a shortcut for opening a new tab to the right of
the currently active tab, plus shortcuts for reordering tabs.

- **Alt+T** — open a new tab immediately to the right of the current tab
- **Alt+.** — move the active tab one position right (wraps around)
- **Alt+,** — move the active tab one position left (wraps around)

Two implementations are kept in this repo, one per browser:

- [`chrome/`](chrome/) — the original Chrome/Chromium extension (MV3, `chrome.*` callback API, service worker background).
- [`firefox/`](firefox/) — a Firefox port (MV3, `browser.*` promise API, event-page background, since Firefox doesn't run MV3 service workers the same way Chrome does). The popup's "assign shortcuts" flow points at `about:addons` instead of `chrome://extensions/shortcuts`, which doesn't exist in Firefox.

See each directory's own README for packaging/loading instructions specific to that browser.
