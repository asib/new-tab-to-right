chrome.commands.onCommand.addListener(function(command) {
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
