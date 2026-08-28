async function updateShortcutWarning() {
    const commands = await chrome.commands.getAll();
    const missingShortcut = commands.some((command) => command.shortcut === "");

    await chrome.action.setBadgeText({text: missingShortcut ? "!" : ""});
    await chrome.action.setBadgeBackgroundColor({color: "#d93025"});
    await chrome.action.setTitle({
        title: missingShortcut
            ? "Shortcuts need assigning"
            : "New Tab to the Right"
    });
}

chrome.runtime.onInstalled.addListener(updateShortcutWarning);
chrome.runtime.onStartup.addListener(updateShortcutWarning);

chrome.commands.onCommand.addListener(function(command) {
    updateShortcutWarning();

    if (command == "open-new-tab") {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.create({index: tabs[0].index + 1});
        });
    } else if (command == "move-tab-right") {
        chrome.tabs.query({active: true, lastFocusedWindow: true}, function(tabs) {
            chrome.tabs.query({lastFocusedWindow: true}, function (allTabs) {
                // If the tab is already the rightmost tab, wrap around to leftmost.
                const newIndex = tabs[0].index === (allTabs.length - 1) ? 0 : tabs[0].index + 1;
                chrome.tabs.move(tabs[0].id, {index: newIndex});
            });
        });
    } else if (command == "move-tab-left") {
        chrome.tabs.query({active: true, lastFocusedWindow: true}, function(tabs) {
            // No special casing needed here - setting index to -1 will wrap the tab round correctly.
            chrome.tabs.move(tabs[0].id, {index: tabs[0].index - 1});
        });
    }
});
