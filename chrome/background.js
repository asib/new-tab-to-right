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

// Returns the index range of the collapsed group directly to the left
// (direction -1) or right (direction 1) of `tab`, or null if there isn't one.
async function collapsedGroupBeside(tab, allTabs, direction) {
    const neighbour = allTabs.find((t) => t.index === tab.index + direction);
    if (!neighbour
        || neighbour.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE
        || neighbour.groupId === tab.groupId) {
        return null;
    }

    const group = await chrome.tabGroups.get(neighbour.groupId);
    if (!group.collapsed) {
        return null;
    }

    const indices = allTabs.filter((t) => t.groupId === group.id).map((t) => t.index);
    return {first: Math.min(...indices), last: Math.max(...indices)};
}

chrome.runtime.onInstalled.addListener(updateShortcutWarning);
chrome.runtime.onStartup.addListener(updateShortcutWarning);

chrome.commands.onCommand.addListener(async function(command) {
    updateShortcutWarning();

    if (command === "open-new-tab") {
        const tabs = await chrome.tabs.query({active: true, currentWindow: true});
        await chrome.tabs.create({index: tabs[0].index + 1});
    } else if (command === "move-tab-right") {
        const tabs = await chrome.tabs.query({active: true, lastFocusedWindow: true});
        const allTabs = await chrome.tabs.query({lastFocusedWindow: true});
        const group = await collapsedGroupBeside(tabs[0], allTabs, 1);
        let newIndex;
        if (group) {
            // Step over a collapsed group rather than landing inside it, which would expand it.
            newIndex = group.last;
        } else {
            // If the tab is already the rightmost tab, wrap around to leftmost.
            newIndex = tabs[0].index === (allTabs.length - 1) ? 0 : tabs[0].index + 1;
        }
        await chrome.tabs.move(tabs[0].id, {index: newIndex});
    } else if (command === "move-tab-left") {
        const tabs = await chrome.tabs.query({active: true, lastFocusedWindow: true});
        const allTabs = await chrome.tabs.query({lastFocusedWindow: true});
        // Step over a collapsed group rather than landing inside it, which would expand it.
        const group = await collapsedGroupBeside(tabs[0], allTabs, -1);
        // No special casing needed for wraparound - setting index to -1 will wrap the tab round correctly.
        const newIndex = group ? group.first : tabs[0].index - 1;
        await chrome.tabs.move(tabs[0].id, {index: newIndex});
    }
});
