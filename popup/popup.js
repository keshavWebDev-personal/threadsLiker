"use strict";
class Msg {
    sendToActiveTab(msg, response = null) {
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            if (!tabs[0].id)
                return;
            chrome.tabs.sendMessage(tabs[0].id, msg, r => {
                if (!response) {
                    return;
                }
                response(r);
            });
        });
    }
}
class Likes {
    elem;
    count;
    constructor() {
        this.count = 0;
        this.elem = document.getElementById("likesCount");
    }
    updateHTML(count) {
        if (count !== null) {
            this.count = count;
        }
        else {
            this.count++;
        }
        if (this.elem) {
            console.log(this.count.toString());
            this.elem.innerText = this.count.toString();
        }
    }
}
let likes = new Likes;
const btn = document.getElementById("btn");
document.addEventListener("DOMContentLoaded", () => {
    const msg = new Msg;
    const minTime = document.getElementById("minTime");
    const maxTime = document.getElementById("maxTime");
    btn?.addEventListener('click', (e) => {
        if (btn.innerText == "Stop") {
            btn.innerText = "Start";
        }
        else if (btn.innerText = "Start") {
            btn.innerText = "Stop";
        }
        if (minTime && maxTime) {
            msg.sendToActiveTab({
                action: "Start Likes",
                minTime: parseInt(minTime?.value),
                maxTime: parseInt(maxTime?.value)
            });
        }
    });
    //To get current Likes Count
    msg.sendToActiveTab({ action: "Give current Likes Count" }, (response) => {
        response ? likes.updateHTML(response.data) : false;
    });
});
// Message Listner
chrome.runtime.onMessage.addListener(msg => {
    //To Update Like count
    if (msg && msg.action == "Like done") {
        likes.updateHTML(null);
    }
    if (msg && msg.info == "interval stopped") {
        if (btn) {
            btn.innerText = "Start";
        }
    }
});
