<script lang="ts">
    let likeCount = 0;
</script>

<main
    class=" bg-zinc-700/[0.4] h-full w-full flex flex-col items-center p-4 gap-6 "
>
    <div class="stats shadow stats-vertical w-full">
        <div class="stat">
            <div class="stat-title">Total Likes</div>
            <div class="stat-value ">{likeCount}</div>
        </div>

        <div class="stat">
            <div class="stat-title">Status</div>
            <div class="stat-value text-success text-3xl">Running</div>
        </div>

    </div>

    <button type="button" class="btn btn-success">Start</button>
    <label class="form-control w-full max-w-xs">
        <div class="label">
            <span class="label-text">Likes Limit</span>
        </div>
        <input
            type="text"
            placeholder="Type here"
            class="input input-bordered w-full max-w-xs"
        />
    </label>
</main>

<style>
    :global(body) {
        width: 250px;
    }
</style>
