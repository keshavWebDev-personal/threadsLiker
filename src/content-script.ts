function webpageContext() {
    let randTime = 0;
    let taskRunning = false;
    let timeOutId = 0;
    let interId = 0

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
    
    async function likeTaskRecursive (maxTime: number, minTime: number) {
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
            console.log(randTime, maxTime, minTime);
            
            timeOutId = setTimeout(()=>{
                likeTaskRecursive(maxTime, minTime);
            }, randTime);
        } catch (error) {
            console.error("likeTaskRecursive() :- Error", error);
            chrome.runtime.sendMessage({
                type: "data",
                title: "reached end of page",
            });
            taskRunning = false;
        }
    }

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
                            likeTaskRecursive(data.maxTime, data.minTime);
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
}
webpageContext()