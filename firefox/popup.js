async function updateStatus() {
    const commands = await browser.commands.getAll();
    const missing = commands.filter((command) => command.shortcut === "");
    const status = document.getElementById("status");

    if (missing.length > 0) {
        status.textContent = "Some shortcuts are not assigned. Open the Add-ons Manager and assign them manually.";
    } else {
        status.textContent = "All shortcuts are assigned.";
    }
}

document.getElementById("open-shortcuts").addEventListener("click", () => {
    browser.tabs.create({url: "about:addons"});
});

updateStatus();
