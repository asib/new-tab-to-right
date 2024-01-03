chrome.commands.onCommand.addListener(function(command) {
    if (command == "open-new-tab") {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.create({index: tabs[0].index + 1});
        });
    } else if (command == "move-tab-right") {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.move(tabs[0].id, {index: tabs[0].index + 1});
        });
    } else if (command == "move-tab-left") {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.move(tabs[0].id, {index: tabs[0].index - 1});
        });
    }
});