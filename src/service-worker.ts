let totalLikesCount = 0;
let likesLimit = 0;

chrome.storage.sync.get(["likesCount"], function ({ likesCount }) {
    if (!likesCount || likesCount.value === undefined) return;

    const now = new Date();
    const yesterday10PM = new Date(now);
    yesterday10PM.setDate(now.getDate() - 1);
    yesterday10PM.setHours(22, 0, 0, 0);

    const today10PM = new Date(now);
    today10PM.setHours(22, 0, 0, 0);

    if (
        !(
            likesCount.timestamp >= yesterday10PM.getTime() &&
            likesCount.timestamp <= today10PM.getTime()
        )
    )
        return;
    totalLikesCount = likesCount.value;
});

function webPageContext(maxTime: number, minTime: number, likesLimit: number) {
    let randTime = 0;
    let taskRunning = false;
    let timeOutId = 0;

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

    let getSVG = (): Promise<SVGElement> => {
        return new Promise((resolve, reject) => {
            let likeElem: SVGAElement | null = document.querySelector('svg[aria-label="Like"]');
            if (likeElem) resolve(likeElem);
            
            let fps = 10
            let interId = setInterval(() => {
                likeElem = document.querySelector('svg[aria-label="Like"]');
                if (!likeElem) {
                    window.scrollTo({
                        top: document.body.scrollHeight,
                        left: 0,
                    });
                    let loadingElem = document.querySelector('svg[aria-label="Loading..."]');
                    if (!loadingElem) {
                        reject("getSVG() :- Reached End of Page, So no more elemnt will be there");
                        clearInterval(interId)
                    }
                } else {
                    resolve(likeElem);
                    clearInterval(interId)
                }
            }, 1000 / fps)
        });
    };
    
    let likeTaskRecursive = async () => {
        try {
            let likeElem = await getSVG();
            likeElem.scrollIntoView({ behavior: "smooth" });
            likeElem.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    
            taskRunning = true;
    
            chrome.runtime.sendMessage({
                type: "data",
                title: "Did a like",
            });
    
            randTime = Math.floor(Math.random() * (maxTime - minTime) + minTime);
            timeOutId = setTimeout(likeTaskRecursive, randTime);
        } catch (error) {
            console.error("likeTaskRecursive() :- Error", error);
            chrome.runtime.sendMessage({
                type: "data",
                title: "Reached end of page or no more likes available",
            });
            taskRunning = false;
        }
    };
    likeTaskRecursive();
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
        func: webPageContext,
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
                            },
                        });

                        if (totalLikesCount >= likesLimit) {
                            stopAllLikeTasksLoops();
                            sendTargetLikeReached_updateToPopup();
                        }
                        break;
                    case "give me likes count":
                        sendResponse({ likes: totalLikesCount });

                        break;
                }
                break;
        }
    }
);
