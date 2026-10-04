<script lang="ts">
	import { onMount } from 'svelte';
	import { BACKEND_OPTIONS, clearSession, getApiBaseUrl, setApiBaseUrl } from '$lib/api';

	let selected = $state<string>(BACKEND_OPTIONS[0].url);

	onMount(() => {
		selected = getApiBaseUrl();
	});

	function changeBackend(event: Event) {
		const url = (event.currentTarget as HTMLSelectElement).value;
		if (url === getApiBaseUrl()) return;
		setApiBaseUrl(url);
		clearSession();
		window.location.reload();
	}
</script>

<label class="backend-picker">
	<span>Backend</span>
	<select value={selected} onchange={changeBackend} aria-label="Pilih backend">
		{#each BACKEND_OPTIONS as backend (backend.url)}
			<option value={backend.url}>{backend.name}</option>
		{/each}
	</select>
</label>

<style>
	.backend-picker {
		display: flex;
		align-items: center;
		gap: 6px;
		color: #657187;
		font-size: 11px;
	}
	select {
		max-width: 105px;
		padding: 6px 8px;
		border: 1px solid #dce2ec;
		border-radius: 6px;
		color: #27344b;
		background: #fff;
		font: inherit;
	}
	:global(body.dark-mode) .backend-picker {
		color: #9eacc2;
	}
	:global(body.dark-mode) select {
		border-color: #34445e;
		color: #dce4f2;
		background: #111b2c;
	}
</style>
