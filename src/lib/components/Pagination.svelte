<script lang="ts">
	let {
		page,
		totalPages,
		disabled = false,
		onPageChange
	}: {
		page: number;
		totalPages: number;
		disabled?: boolean;
		onPageChange: (page: number) => void;
	} = $props();
</script>

<div class="pagination">
	<button
		onclick={() => onPageChange(page - 1)}
		disabled={disabled || page <= 1}
		aria-label="Halaman sebelumnya">‹</button
	>
	<span>Halaman <strong>{page}</strong> dari <strong>{totalPages}</strong></span>
	<button
		onclick={() => onPageChange(page + 1)}
		disabled={disabled || page >= totalPages}
		aria-label="Halaman berikutnya">›</button
	>
</div>

<style>
	.pagination {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.pagination button {
		width: 29px;
		height: 29px;
		border: 1px solid #e0e5ed;
		background: #fff;
		color: #5b6880;
		border-radius: 6px;
		cursor: pointer;
		font-size: 20px;
		line-height: 1;
	}
	.pagination button:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}
	:global(body.dark-mode) .pagination button {
		color: #dce4f2;
		background: #26344b;
		border-color: #3a4b66;
	}
</style>
