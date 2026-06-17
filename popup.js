async function updateStatus() {
    const commands = await chrome.commands.getAll();
    const missing = commands.filter((command) => command.shortcut === "");
    const status = document.getElementById("status");

    if (missing.length > 0) {
        status.textContent = "Some shortcuts are not assigned. Open Chrome's shortcut settings and assign them manually.";
    } else {
        status.textContent = "All shortcuts are assigned.";
    }
}

document.getElementById("open-shortcuts").addEventListener("click", () => {
    chrome.tabs.create({url: "chrome://extensions/shortcuts"});
});

updateStatus();
