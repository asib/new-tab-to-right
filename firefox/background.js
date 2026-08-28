async function updateShortcutWarning() {
    const commands = await browser.commands.getAll();
    const missingShortcut = commands.some((command) => command.shortcut === "");

    await browser.action.setBadgeText({text: missingShortcut ? "!" : ""});
    await browser.action.setBadgeBackgroundColor({color: "#d93025"});
    await browser.action.setTitle({
        title: missingShortcut
            ? "Shortcuts need assigning"
            : "New Tab to the Right"
    });
}

browser.runtime.onInstalled.addListener(updateShortcutWarning);
browser.runtime.onStartup.addListener(updateShortcutWarning);

browser.commands.onCommand.addListener(async function(command) {
    updateShortcutWarning();

    if (command === "open-new-tab") {
        const tabs = await browser.tabs.query({active: true, currentWindow: true});
        await browser.tabs.create({index: tabs[0].index + 1});
    } else if (command === "move-tab-right") {
        const tabs = await browser.tabs.query({active: true, lastFocusedWindow: true});
        const allTabs = await browser.tabs.query({lastFocusedWindow: true});
        // If the tab is already the rightmost tab, wrap around to leftmost.
        const newIndex = tabs[0].index === (allTabs.length - 1) ? 0 : tabs[0].index + 1;
        await browser.tabs.move(tabs[0].id, {index: newIndex});
    } else if (command === "move-tab-left") {
        const tabs = await browser.tabs.query({active: true, lastFocusedWindow: true});
        // No special casing needed here - setting index to -1 will wrap the tab round correctly.
        await browser.tabs.move(tabs[0].id, {index: tabs[0].index - 1});
    }
});
