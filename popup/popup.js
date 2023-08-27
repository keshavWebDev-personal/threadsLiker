"use strict";
const btn = document.getElementById("btn");
const minTime = document.getElementById("minTime");
const maxTime = document.getElementById("maxTime");
btn?.addEventListener('click', (e) => {
    if (btn.innerText == "Stop") {
        btn.innerText = "Start";
    }
    else if (btn.innerText = "Start") {
        btn.innerText = "Stop";
    }
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        tabs.forEach((tab) => {
            if (!tab.id)
                return;
            if (minTime && maxTime) {
                chrome.tabs.sendMessage(tab.id, { action: "Start Likes", minTime: parseInt(minTime.value), maxTime: parseInt(maxTime?.value) });
            }
        });
    });
});
