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

// Returns the group of `neighbour`, the tab next to `tab`, with its index
// range, or null if there's no neighbour, it isn't grouped, or `tab` is in it.
async function groupBeside(tab, neighbour, allTabs) {
    if (!neighbour
        || neighbour.groupId === browser.tabGroups.TAB_GROUP_ID_NONE
        || neighbour.groupId === tab.groupId) {
        return null;
    }

    const group = await browser.tabGroups.get(neighbour.groupId);
    const indices = allTabs.filter((t) => t.groupId === group.id).map((t) => t.index);
    return {id: group.id, collapsed: group.collapsed, first: Math.min(...indices), last: Math.max(...indices)};
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

// Moves the active tab one position left (direction -1) or right (direction 1).
async function moveActiveTab(direction) {
    const tabs = await browser.tabs.query({active: true, lastFocusedWindow: true});
    const allTabs = await browser.tabs.query({lastFocusedWindow: true});
    const tab = tabs[0];
    const neighbour = allTabs.find((t) => t.index === tab.index + direction);

    if (tab.groupId !== browser.tabGroups.TAB_GROUP_ID_NONE && neighbour?.groupId !== tab.groupId) {
        // The tab is at the edge of its group, so leave the group but stay put,
        // just outside it. This mirrors joining a group at its edge, below.
        await browser.tabs.ungroup(tab.id);
        return;
    }

    const group = await groupBeside(tab, neighbour, allTabs);
    if (group && !group.collapsed) {
        // Join the group at the edge the tab is next to. Moving one position
        // would put the tab one in from that edge instead. Firefox appends
        // grouped tabs to the end of the group, so put the tab back where it
        // was, which is now the group's edge.
        await browser.tabs.group({groupId: group.id, tabIds: tab.id});
        await browser.tabs.move(tab.id, {index: tab.index});
        return;
    }

    let newIndex;
    if (group) {
        // Step over a collapsed group rather than landing inside it.
        newIndex = direction === 1 ? group.last : group.first;
    } else if (direction === 1) {
        // If the tab is already the rightmost tab, wrap around to leftmost.
        newIndex = tab.index === (allTabs.length - 1) ? 0 : tab.index + 1;
    } else {
        // No special casing needed here - setting index to -1 will wrap the tab round correctly.
        newIndex = tab.index - 1;
    }
    await moveTab(tab, newIndex);
}

browser.runtime.onInstalled.addListener(updateShortcutWarning);
browser.runtime.onStartup.addListener(updateShortcutWarning);

browser.commands.onCommand.addListener(async function(command) {
    updateShortcutWarning();

    if (command === "open-new-tab") {
        const tabs = await browser.tabs.query({active: true, currentWindow: true});
        const newTab = await browser.tabs.create({index: tabs[0].index + 1});
        // A tab created just past a group's last tab is left out of the group,
        // so add it to keep it with the tab it was opened from.
        if (tabs[0].groupId !== browser.tabGroups.TAB_GROUP_ID_NONE && newTab.groupId !== tabs[0].groupId) {
            await browser.tabs.group({groupId: tabs[0].groupId, tabIds: newTab.id});
        }
    } else if (command === "move-tab-right") {
        await moveActiveTab(1);
    } else if (command === "move-tab-left") {
        await moveActiveTab(-1);
    }
});
