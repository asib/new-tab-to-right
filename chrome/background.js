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

// Returns the group directly to the left (direction -1) or right (direction 1)
// of `tab`, with its index range, or null if there isn't one or the tab is in it.
async function groupBeside(tab, allTabs, direction) {
    const neighbour = allTabs.find((t) => t.index === tab.index + direction);
    if (!neighbour
        || neighbour.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE
        || neighbour.groupId === tab.groupId) {
        return null;
    }

    const group = await chrome.tabGroups.get(neighbour.groupId);
    const indices = allTabs.filter((t) => t.groupId === group.id).map((t) => t.index);
    return {id: group.id, collapsed: group.collapsed, first: Math.min(...indices), last: Math.max(...indices)};
}

// Moves the active tab one position left (direction -1) or right (direction 1).
async function moveActiveTab(direction) {
    const tabs = await chrome.tabs.query({active: true, lastFocusedWindow: true});
    const allTabs = await chrome.tabs.query({lastFocusedWindow: true});
    const tab = tabs[0];
    const group = await groupBeside(tab, allTabs, direction);

    if (group && !group.collapsed) {
        // Join the group at the edge the tab is next to. Moving one position
        // would put the tab one in from that edge instead.
        await chrome.tabs.group({groupId: group.id, tabIds: tab.id});
        return;
    }

    let newIndex;
    if (group) {
        // Step over a collapsed group rather than landing inside it, which would expand it.
        newIndex = direction === 1 ? group.last : group.first;
    } else if (direction === 1) {
        // If the tab is already the rightmost tab, wrap around to leftmost.
        newIndex = tab.index === (allTabs.length - 1) ? 0 : tab.index + 1;
    } else {
        // No special casing needed here - setting index to -1 will wrap the tab round correctly.
        newIndex = tab.index - 1;
    }
    await chrome.tabs.move(tab.id, {index: newIndex});
}

chrome.runtime.onInstalled.addListener(updateShortcutWarning);
chrome.runtime.onStartup.addListener(updateShortcutWarning);

chrome.commands.onCommand.addListener(async function(command) {
    updateShortcutWarning();

    if (command === "open-new-tab") {
        const tabs = await chrome.tabs.query({active: true, currentWindow: true});
        await chrome.tabs.create({index: tabs[0].index + 1});
    } else if (command === "move-tab-right") {
        await moveActiveTab(1);
    } else if (command === "move-tab-left") {
        await moveActiveTab(-1);
    }
});
