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

// Returns the index range of the collapsed group directly to the left
// (direction -1) or right (direction 1) of `tab`, or null if there isn't one.
async function collapsedGroupBeside(tab, allTabs, direction) {
    const neighbour = allTabs.find((t) => t.index === tab.index + direction);
    if (!neighbour
        || neighbour.groupId === browser.tabGroups.TAB_GROUP_ID_NONE
        || neighbour.groupId === tab.groupId) {
        return null;
    }

    const group = await browser.tabGroups.get(neighbour.groupId);
    if (!group.collapsed) {
        return null;
    }

    const indices = allTabs.filter((t) => t.groupId === group.id).map((t) => t.index);
    return {first: Math.min(...indices), last: Math.max(...indices)};
}

// Firefox adds a tab moved to the edge of a group into that group, even when
// it lands outside the group's tabs (including when wrapping around). If that
// group is collapsed, take the tab back out so it stays beside the group.
async function moveTab(tab, index) {
    await browser.tabs.move(tab.id, {index});
    const moved = await browser.tabs.get(tab.id);
    if (moved.groupId === tab.groupId || moved.groupId === browser.tabGroups.TAB_GROUP_ID_NONE) {
        return;
    }

    const group = await browser.tabGroups.get(moved.groupId);
    if (group.collapsed) {
        await browser.tabs.ungroup(tab.id);
    }
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
        const group = await collapsedGroupBeside(tabs[0], allTabs, 1);
        let newIndex;
        if (group) {
            // Step over a collapsed group rather than landing inside it.
            newIndex = group.last;
        } else {
            // If the tab is already the rightmost tab, wrap around to leftmost.
            newIndex = tabs[0].index === (allTabs.length - 1) ? 0 : tabs[0].index + 1;
        }
        await moveTab(tabs[0], newIndex);
    } else if (command === "move-tab-left") {
        const tabs = await browser.tabs.query({active: true, lastFocusedWindow: true});
        const allTabs = await browser.tabs.query({lastFocusedWindow: true});
        // Step over a collapsed group rather than landing inside it.
        const group = await collapsedGroupBeside(tabs[0], allTabs, -1);
        // No special casing needed for wraparound - setting index to -1 will wrap the tab round correctly.
        const newIndex = group ? group.first : tabs[0].index - 1;
        await moveTab(tabs[0], newIndex);
    }
});
