<script lang="ts">
    let likesCount = 0;
    let likesLimit = 50;
    let taskRunning = false;

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
        // Setup the Webpage Context
        await chrome.runtime.sendMessage({ type: "action", title: "setup webpage context" });

        // Getting Likes Count and Likes Limit from Service Worker
        const res1 = await chrome.runtime.sendMessage({ type: "data", title: "give me likes count" });
        const res2 = await chrome.runtime.sendMessage({ type: "data", title: "give me likes limit" });
        if (res1.failed || res2.failed) return
        likesCount = res1.likes;
        likesLimit = res2.likesLimit
        
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
</script>

<main
    class=" bg-zinc-700/[0.4] h-full w-full flex flex-col items-center p-4 gap-6"
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
        class="btn capitalize"
        class:btn-error={taskRunning}
        class:btn-success={!taskRunning}
        disabled={likesLimit <= likesCount}
        on:click={handleClick}
    >
        {taskRunning ? "Stop" : "Start"}
    </button>
    <label class="form-control w-full max-w-xs">
        <div class="label">
            <span class="label-text">Likes Limit</span>
            <div
                class="badge badge-success gap-2 animate-pulse"
                class:block={likesLimit <= likesCount}
                class:hidden={likesLimit > likesCount}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    class="inline-block h-4 w-4 stroke-current  " 
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                    ></path>
                </svg>
                Reached
            </div>
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
</main>

<style>
    :global(body) {
        width: 250px;
    }
</style>
