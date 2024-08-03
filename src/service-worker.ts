let totalLikesCount = 0;
let likesLimit = 0;

// -------------------------------------------------
// ------------------Some Functions-----------------
// -------------------------------------------------


function webPageContext() {
    let randTime = 0;
    let taskRunning = false;
    let timeOutId = 0;
    let interId = 0
    console.log("Succesfull in running");
    
    chrome.runtime.onMessage.addListener(
        ({ type, title, ...data }, _, sendResponse) => {
            switch (type) {
                case "action":
                    switch (title) {
                        case "Stop Likes Task":
                            clearTimeout(timeOutId);
                            clearInterval(interId)
                            taskRunning = false;
                            break;
                        case "Start Liking":
                            likeTaskRecursive(data.maxTime, data.minTime, data.likesLimit);
                            break
                    }
                    break;
                case "data":
                    switch (title) {
                        case "give me task status":
                            sendResponse({
                                taskRunning: taskRunning,
                            });
                            break;
                    }
                    break;
            }
        }
    );

    let getSVG = (): Promise<SVGElement> => {
        return new Promise((resolve, reject) => {
            let likeElem: SVGAElement | null = document.querySelector('svg[aria-label="Like"]');
            if (likeElem) resolve(likeElem);
            
            let fps = 10
            interId = setInterval(() => {
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
    
    let likeTaskRecursive = async (maxTime: number, minTime: number, likesLimit: number) => {
        try {
            taskRunning = true;
            let likeElem = await getSVG();
            likeElem.scrollIntoView({ behavior: "smooth" });
            likeElem.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    
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
                title: "reached end of page",
            });
            taskRunning = false;
        }
    };
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

async function startLiking_currPage(
    maxTime: number,
    minTime: number,
    likesLimit: number
) {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) return
    chrome.tabs.sendMessage(tab.id, {type: "action", title: "Start Liking",})
}

// -------------------------------------------------
// -------------Main Event Listner------------------
// -------------------------------------------------

chrome.runtime.onMessage.addListener(({ type, title, ...data }, _, sendResponse) => {
        switch (type) {
            case "action":
                switch (title) {
                    case "Start Liking":
                        startLiking_currPage(
                            data.maxTime,
                            data.minTime,
                            likesLimit
                        );
                        break;
                    case "Stop Liking":
                        stopAllLikeTasksLoops();
                        break;
                    case "setup webpage context":
                        (async () => {
                            let tabs = await chrome.tabs.query({});
                            tabs.forEach((tab) => {
                                const {host_permissions} = chrome.runtime.getManifest();
                                if (tab.id && tab.url?.match(host_permissions[0])){
                                    chrome.scripting.executeScript({
                                        target: { tabId: tab.id },
                                        func: webPageContext,
                                    });
                                }
                            })
                        })()
                        break
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
                            chrome.runtime.sendMessage({ type: "data", title: "Target Like Reached" });
                        }
                        break;
                    case "give me likes count":
                        (async () => {
                            let res = await chrome.storage.sync.get(["likesCount"]);
                            if (!res.likesCount || res.likesCount.value === undefined) {
                                totalLikesCount = 0
                            }else{
                                const now = new Date();
                                const yesterday10PM = new Date(now);
                                yesterday10PM.setDate(now.getDate() - 1);
                                yesterday10PM.setHours(22, 0, 0, 0);
                            
                                const today10PM = new Date(now);
                                today10PM.setHours(22, 0, 0, 0);
                                if (!( res.likesCount.timestamp >= yesterday10PM.getTime() && res.likesCount.timestamp <= today10PM.getTime() )){
                                    totalLikesCount = 0
                                }else{
                                    totalLikesCount = res.likesCount.value;
                                };
                            };
                            sendResponse({ likes: totalLikesCount });
                        })();
                        return true;
                        break;

                    case "Updated Likes Limit":
                        likesLimit = data.likesLimit
                        chrome.storage.sync.set({
                            likesLimit: {
                                value: likesLimit
                            },
                        });
                    case "give me likes limit":
                        (async () => {
                            let res = await chrome.storage.sync.get(["likesLimit"]);
                            if (!res.likesLimit || res.likesLimit.value === undefined) {likesLimit = 0};
                            likesLimit = res.likesLimit.value;            
                            sendResponse({likesLimit: likesLimit});
                        })();
                        return true;
                        break;
                }
                break;
        }
    }
);
