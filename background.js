chrome.commands.onCommand.addListener(function(command) {
    if (command == "open-new-tab") {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.create({index: tabs[0].index + 1});
        });
    }
});