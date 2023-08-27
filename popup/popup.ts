const btn = document.getElementById("btn")
const minTime: HTMLInputElement | null = document.getElementById("minTime") as HTMLInputElement | null
const maxTime: HTMLInputElement | null= document.getElementById("maxTime") as HTMLInputElement | null

btn?.addEventListener('click', (e) => {
    if (btn.innerText == "Stop") {
        btn.innerText = "Start"
    } else if (btn.innerText = "Start") {
        btn.innerText = "Stop"
    }
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        tabs.forEach((tab) => {
            if (!tab.id) return
            if (minTime && maxTime) {
                chrome.tabs.sendMessage(tab.id, { action: "Start Likes" , minTime: parseInt(minTime.value), maxTime: parseInt(maxTime?.value)})
            }
        })
    })
})