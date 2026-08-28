# New Tab to the Right (Firefox)

Firefox port of [asib/new-tab-to-right](https://github.com/asib/new-tab-to-right). Adds:

- **Alt+T** — open a new tab immediately to the right of the current tab
- **Alt+.** — move the active tab one position right (wraps around)
- **Alt+,** — move the active tab one position left (wraps around)

Ported from Chrome's MV3 `chrome.*` callback API to Firefox's promise-based
`browser.*` API, and the background service worker was swapped for an MV3
event page (`background.scripts`), since Firefox doesn't run MV3 service
workers the same way Chrome does.

## Load temporarily for testing

1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on…"
3. Select `manifest.json` in this directory

The add-on is removed when Firefox restarts; reload it the same way to test
changes.

## Assign the keyboard shortcuts

Firefox doesn't reliably auto-apply `suggested_key` bindings for commands.
Open the extension's popup and click "Open Add-ons Manager", then click the
gear icon → "Manage Extension Shortcuts" to assign or confirm the shortcuts.

## Package / sign for permanent install

Permanent installs (including in regular Firefox, not just Nightly/Developer
Edition) require the add-on to be signed by Mozilla.

```sh
npm install --global web-ext
web-ext lint
web-ext sign --api-key=<AMO_JWT_ISSUER> --api-secret=<AMO_JWT_SECRET>
```

Get API credentials from https://addons.mozilla.org/developers/addon/api/key/.
Before signing, replace the placeholder `browser_specific_settings.gecko.id`
in `manifest.json` with a unique ID (e.g. `your-name@yourdomain.com`).
