<script lang="ts">
	let { darkMode, onToggle }: { darkMode: boolean; onToggle: () => void } = $props();
</script>

<button class="theme-toggle" onclick={onToggle} aria-label="Ganti tema">
	{darkMode ? '☀' : '☾'} <span>{darkMode ? 'Light' : 'Dark'}</span>
</button>

<style>
	.theme-toggle {
		border: 1px solid #e0e5ed;
		border-radius: 7px;
		padding: 7px 10px;
		color: #536078;
		background: #fff;
		cursor: pointer;
		font-size: 12px;
	}
	:global(body.dark-mode) .theme-toggle {
		color: #dce4f2;
		background: #111b2c;
		border-color: #34445e;
	}
</style>
