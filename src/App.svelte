<script lang="ts">
    let likesCount = 0;
    let likesLimit = 50;
    let taskRunning = false;
    let dialog: HTMLDialogElement;
    $: dialog? (likesLimit <= likesCount) ? dialog.showModal() : dialog.close(): null

    async function handleClick() {
        if (taskRunning) {
            // A Message to Service Worker to Stop the Task Loop wiith
            chrome.runtime.sendMessage({
                type: "action",
                title: "Stop Liking",
            });
        } else {
            // A Messgae to Service WOrker to Start the Task Loop
            // Max time, Min Time, Likes Limit
            chrome.runtime.sendMessage({
                type: "action",
                title: "Start Liking",
                maxTime: 3000,
                minTime: 1000,
                likesLimit: likesLimit,
            });
        }

        // Flipping the boolean
        taskRunning = !taskRunning;
    }
    chrome.runtime.onMessage.addListener(({ type, title, ...data }) => {
        // Data Related Messages
        if (type === "data") {
            if (title == "Like Count") {
                likesCount = data.data;
            } else if (title == "Target Like Reached") {
                taskRunning = false;
            }else if (title == "reached end of page") {
                taskRunning = false;
            }
        }
    });

    window.onload = async () => {
        // Getting Likes Count and Likes Limit from Service Worker
        const res1 = await chrome.runtime.sendMessage({ type: "data", title: "give me likes count" });
        const res2 = await chrome.runtime.sendMessage({ type: "data", title: "give me likes limit", default: likesLimit });
        
        if (!res1.failed) likesCount = res1.likes;
        if (!res2.failed) likesLimit = res2.likesLimit;
        
        // Getting Task Status from the Current Tab
        let [tab] = await chrome.tabs.query({active: true})
        if (!tab || !tab.id) { console.log("Tab not found"); return};
        try {
            let res = await chrome.tabs.sendMessage(tab.id, {type: "data", title: "give me task status",})
            taskRunning = res.taskRunning
        } catch (error) {
        }

    };

    function onLikeLimitChange() {
        chrome.runtime.sendMessage({
            type: "data",
            title: "Updated Likes Limit",
            likesLimit: likesLimit,
        })
    }

    function openLinks() {
        const links = [
            "https://www.threads.net/@sachishiksha.in",
            "https://www.threads.net/@honeypreet_insan",
            "https://www.threads.net/@sachkahoon",
            "https://www.threads.net/@sachkahoonpunjabi",
            "https://www.threads.net/@saintdrmsginsan",
            "https://www.threads.net/@dss_org"
        ]
        links.forEach((link) => {
            chrome.tabs.create({ url: link });
        })
    }
</script>

<main
    class=" bg-zinc-700/[0.4] h-full w-full flex flex-col items-center p-4"
>
    <div class="stats shadow stats-vertical w-full">
        <div class="stat">
            <div class="stat-title">Total Likes</div>
            <div class="stat-value relative">
                <p class="z-10 relative" >{likesCount}</p>
                <div
                    class:block={!taskRunning && likesCount > 0}
                    class:hidden={taskRunning || likesCount == 0 || likesCount < likesLimit}
                    class="stat-value top-0 absolute animate-ping text-success z-0"
                >
                    {likesCount}
                </div>
            </div>

            <div class="stat-desc">Today</div>
        </div>

        <div class="stat">
            <div class="stat-title">Status</div>
            <div
                class="stat-value text-3xl text-"
                class:animate-pulse={taskRunning}
                class:text-success={taskRunning}
                class:text-info={!taskRunning}
            >
                {taskRunning ? "Working" : "Resting"}
            </div>
            <div class="stat-desc">On Current Page</div>
        </div>
    </div>

    <button
        type="button"
        class="btn capitalize mt-6"
        class:btn-error={taskRunning}
        class:btn-success={!taskRunning}
        disabled={likesLimit <= likesCount}
        on:click={handleClick}
    >
        {taskRunning ? "Stop" : "Start"}
    </button>
    <div class="grid grid-cols-[1fr_auto_1fr] mt-2">
        <label class="form-control w-full max-w-xs">
            <div class="label">
                <span class="label-text">Likes Limit</span>
            </div>
            <input
                type="text"
                placeholder="Type here"
                class="input input-bordered w-full max-w-xs relative before:content-[''] before:size-full before:bg-green-300"
                bind:value={likesLimit}
                disabled={taskRunning}
                on:input={onLikeLimitChange}
            />
        </label>
        <div class="divider divider-horizontal mx-1 mt-4"></div>
        <button class="btn self-end" on:click={openLinks}>Open Links</button>
    </div>
</main>
<dialog bind:this={dialog} class="modal modal-bottom">
    <div class="modal-box bg-successContent">
    <form method="dialog">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
    </form>
    <h3 class="text-lg font-bold">Target Reach</h3>
    <p class="py-4">reached the target of {likesLimit} likes</p>
    </div>
</dialog>

<style>
    :global(body) {
        width: 250px;
    }
</style>
