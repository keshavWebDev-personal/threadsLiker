let totalLikesCount = 0;
let likesLimit = 0;
chrome.storage.sync.get(['likesCount'], function({likesCount}) {
    if (likesCount == undefined || likesCount.value == undefined) return
    const timeDiff = Date.now() - likesCount.timestamp;
    if (timeDiff > 1000 * 60 * 60 * 24) return
    totalLikesCount = likesCount.value
});


function likeTaskLoop(maxTime: number, minTime: number, likesLimit: number) {
    let taskRunning = true
    let randTime = Math.floor(Math.random() * (maxTime - minTime) + minTime);
    let timeOutId = setTimeout(() => {
        let likeElem = document.querySelector('svg[aria-label="Like"]');
        if (!likeElem) {
            let rafId = 0;
            let targetFPS: number = 1;
            let lastTimeStamp: number = 0;
            let check = (timeStamp: number) => {
                if (timeStamp - lastTimeStamp <= 1000 / targetFPS) {
                    rafId = requestAnimationFrame(check);
                    return;
                }
                lastTimeStamp = timeStamp;

                likeElem = document.querySelector('svg[aria-label="Like"]');
                if (!likeElem) {
                    window.scrollTo({
                        top: document.body.scrollHeight,
                        left: 0,
                        behavior: "smooth",
                    });
                    let loadingElem = document.querySelector(
                        'svg[aria-label="Loading..."]'
                    );
                    if (!loadingElem) {
                        return "reached End of page";
                    } else {
                        rafId = requestAnimationFrame(check);
                    }
                }
            };
            requestAnimationFrame(check);
        }
        if (!likeElem) return;
        likeElem.scrollIntoView({ behavior: "smooth" });
        likeElem.dispatchEvent(new MouseEvent("click", { bubbles: true }));

        chrome.runtime.sendMessage({
            type: "data",
            title: "Did a like",
        });

        likeTaskLoop(maxTime, minTime, likesLimit);
    }, randTime);

    chrome.runtime.onMessage.addListener(
        ({ type, title, ...data }, _, sendResponse) => {
            if (type == "action") {
                if (title == "Stop Likes Task") {
                    clearTimeout(timeOutId);
                    taskRunning = false;
                }   
            }
            if (type == "data") {
                if (title == "give me task status") {
                    sendResponse({
                        taskRunning: taskRunning,
                    });
                }
            }
        }
    );
}

function stopAllLikeTasksLoops() {
    const manifest = chrome.runtime.getManifest();
    if (manifest.host_permissions) {
        const urlPatterns = manifest.host_permissions;

        // Query for tabs matching these URL patterns
        chrome.tabs.query({ url: urlPatterns }, function (tabs) {
            for (let tab of tabs) {
                if (!tab.id) return;
                chrome.tabs.sendMessage(tab.id, {
                    type: "action",
                    title: "Stop Likes Task",
                });
            }
        });
    }
}

async function injectAutomaticLikerInCurrentPage(
    maxTime: number,
    minTime: number,
    likesLimit: number
) {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) return;
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: likeTaskLoop,
        args: [maxTime, minTime, likesLimit],
    });
}

function sendTargetLikeReached_updateToPopup() {
    chrome.runtime.sendMessage({ type: "data", title: "Target Like Reached" });
}

chrome.runtime.onMessage.addListener(
    async ({ type, title, ...data }, _, sendResponse) => {
        switch (type) {
            case "action":
                switch (title) {
                    case "Start Liking":
                        likesLimit = data.likesLimit;
                        injectAutomaticLikerInCurrentPage(
                            data.maxTime,
                            data.minTime,
                            likesLimit
                        );
                        break;
                    case "Stop Liking":
                        stopAllLikeTasksLoops();
                        break;
                    
                }
                break;
            case "data":
                switch (title) {
                    case "Did a like":
                        totalLikesCount++;
                        chrome.runtime.sendMessage({
                            type: "data",
                            title: "Like Count",
                            data: totalLikesCount,
                        });
                        // Store total likes count
                        chrome.storage.sync.set({
                            likesCount: {
                                value: totalLikesCount,
                                timestamp: Date.now(),
                            }
                        });

                        if (totalLikesCount >= likesLimit) {
                            stopAllLikeTasksLoops();
                            sendTargetLikeReached_updateToPopup();
                        }
                        break;
                    case "give me likes count":
                        sendResponse({likes: totalLikesCount});
                        
                        break;
                }
                break;
        }
    }
);
