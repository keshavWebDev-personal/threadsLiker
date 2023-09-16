"use strict";
class Like {
    elem;
    done;
    do;
    rafId;
    constructor() {
        this.elem = document.querySelector('svg[aria-label="Like"]');
        this.done = false;
        this.rafId = 0;
        this.do = new Promise((resolve, reject) => {
            if (this.elem) {
                this.elem.scrollIntoView({ behavior: 'smooth' });
                this.elem.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                this.done = true;
                resolve(true);
            }
            else {
                let targetFPS = 1;
                let lastTimeStamp = 0;
                let check = (timeStamp) => {
                    if (timeStamp - lastTimeStamp <= (1000 / targetFPS)) {
                        this.rafId = requestAnimationFrame(check);
                        return;
                    }
                    lastTimeStamp = timeStamp;
                    this.elem = document.querySelector('svg[aria-label="Like"]');
                    if (!this.elem) {
                        window.scrollTo({ top: document.body.scrollHeight, left: 0, behavior: "smooth" });
                        let loadingElem = document.querySelector('svg[aria-label="Loading..."]');
                        if (!loadingElem) {
                            reject("reached End of page");
                        }
                        else {
                            this.rafId = requestAnimationFrame(check);
                        }
                    }
                    else {
                        this.elem.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                        resolve(true);
                    }
                };
                requestAnimationFrame(check);
            }
        });
    }
}
class LikeInterval {
    isrunning;
    intervalId;
    likeElem;
    count;
    constructor() {
        this.isrunning = false;
        this.intervalId = null;
        this.likeElem = null;
        this.count = 0;
    }
    start(minTime, maxTime) {
        this.isrunning = true;
        let randTime = Math.floor((Math.random() * (maxTime - minTime)) + minTime);
        this.likeElem = new Like;
        this.intervalId = setTimeout(async () => {
            try {
                const result = await this.likeElem?.do;
                await chrome.runtime.sendMessage({ action: "Like done" });
                this.count++;
                this.start(minTime, maxTime);
            }
            catch (error) {
                console.log(error);
                this.stop();
            }
        }, randTime);
    }
    stop() {
        if (this.intervalId) {
            clearTimeout(this.intervalId);
        }
        if (this.likeElem?.rafId) {
            cancelAnimationFrame(this.likeElem.rafId);
        }
        this.isrunning = false;
        chrome.runtime.sendMessage({ info: "interval stopped" });
    }
}
let likeInterval = new LikeInterval();
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.action == "Start Likes") {
        if (!likeInterval.isrunning) {
            likeInterval.start(msg.minTime, msg.maxTime);
            console.log("Started");
        }
        else {
            likeInterval.stop();
            likeInterval = new LikeInterval();
        }
    }
    if (msg && msg.action == "Give current Likes Count") {
        sendResponse({ data: likeInterval.count });
    }
});
