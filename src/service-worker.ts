let timeOutId = 0
let likeCount = 0

function likeTaskLoop(maxTime:number, minTime:number, likesLimit:number ) {
    let randTime = Math.floor((Math.random() * (maxTime - minTime)) + minTime)
    timeOutId = setTimeout(async () => {
        //--------------------// 
        // Webpage Interaction
        //--------------------// 
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        if (!tab.id) return
        chrome.scripting.executeScript({
            target:{tabId: tab.id},
            func: ()=>{
                console.log("Looped");
                let likeElem = document.querySelector('svg[aria-label="Like"]')
                if (!likeElem) return
                likeElem.scrollIntoView({behavior: 'smooth'})
                likeElem.dispatchEvent(new MouseEvent('click', { bubbles: true }))
            }
        })
        likeCount++

        //--------------------// 
        // Checks to Stop the Loop
        //--------------------// 
        if (likeCount>=likesLimit) {
            return
        }

        likeTaskLoop(maxTime, minTime, likesLimit)
    }, randTime);   
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.action == "Start Likes") {
        likeTaskLoop(msg.maxTime, msg.minTime, msg.likesLimit)
    }
})