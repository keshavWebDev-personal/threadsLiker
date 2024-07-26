<script lang="ts">
    let totalLikesCount = 0;
    let likesLimit = 10
    let taskRunning = false

    

    function handleClick() {
        if (taskRunning){
            // A Message to Service Worker to Stop the Task Loop wiith
            // Max time, Min Time, Likes Limit
        }else{
            // A Messgae to Service WOrker to Start the Task Loop
        }

        // Flipping the boolean
        taskRunning = !taskRunning
        console.log("Started");
    }

    // A Event Listner to Listen for Likes Limit Hit and flip the taskRunnig Bollean
    
</script>

<main
    class=" bg-zinc-700/[0.4] h-full w-full flex flex-col items-center p-4 gap-6 "
>
    <div class="stats shadow stats-vertical w-full">
        <div class="stat">
            <div class="stat-title">Total Likes</div>
            <div class="stat-value relative ">
                {totalLikesCount}
                <div class:block={!taskRunning && totalLikesCount > 0} class:hidden={taskRunning || totalLikesCount == 0} class="stat-value top-0 absolute animate-ping text-success">{totalLikesCount}</div>
            </div>
            
            <div class="stat-desc">Today</div>
        </div>

        <div class="stat">
            <div class="stat-title">Status</div>
            <div class="stat-value text-3xl" class:animate-pulse={taskRunning}  class:text-success={taskRunning} class:text-error={!taskRunning}>{taskRunning?"Running":"Stopped"}</div>
            <div class="stat-desc">On Current Page</div>
        </div>

    </div>

    <button type="button" class="btn capitalize " class:btn-error={taskRunning} class:btn-success={!taskRunning}  on:click={handleClick} >{taskRunning?"Stop":"Start"}</button>
    <label class="form-control w-full max-w-xs">
        <div class="label">
            <span class="label-text">Likes Limit</span>
        </div>
        <input
            type="text"
            placeholder="Type here"
            class="input input-bordered w-full max-w-xs"
            bind:value={likesLimit}
        />
    </label>
</main>

<style>
    :global(body) {
        width: 250px;
    }
</style>
