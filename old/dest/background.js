"use strict";
let likesCount = 0;
// Message Listner
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    //To Update Like count
    if (msg && msg.action == "Like done") {
        likesCount++;
        console.log(likesCount);
    }
    if (msg && msg.action == "Give current Likes Count") {
        sendResponse({ data: likesCount });
    }
});
