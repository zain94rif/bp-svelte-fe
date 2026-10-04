<script lang="ts">
	import { getCaptcha } from '$lib/api';
	import { PUBLIC_CAPTCHA_MODE, PUBLIC_CAPTCHA_REQUIRED } from '$env/static/public';
	import type { CaptchaChallenge } from '$lib/types';
	import { onMount } from 'svelte';

	let {
		captchaId = $bindable(''),
		answer = $bindable(''),
		refreshToken = 0
	}: { captchaId?: string; answer?: string; refreshToken?: number } = $props();
	let challenge = $state<CaptchaChallenge | null>(null);
	let loading = $state(false);
	const mode =
		PUBLIC_CAPTCHA_MODE || (PUBLIC_CAPTCHA_REQUIRED === 'true' ? 'provider' : 'disabled');

	async function refresh() {
		if (mode !== 'internal') return;
		loading = true;
		try {
			const result = await getCaptcha();
			challenge = result?.data ?? null;
			captchaId = challenge?.captcha_id ?? '';
			answer = '';
		} finally {
			loading = false;
		}
	}

	onMount(refresh);
	$effect(() => {
		const token = refreshToken;
		if (token > 0) refresh();
	});
</script>

{#if mode === 'internal'}
	<div class="captcha-field">
		<div class="captcha-head">
			<span>CAPTCHA gambar</span><button type="button" onclick={refresh} disabled={loading}
				>{loading ? 'Memuat...' : '↻ Baru'}</button
			>
		</div>
		{#if challenge}<img src={challenge.image} alt="CAPTCHA" />{/if}
		<input type="hidden" value={captchaId} />
		<input bind:value={answer} placeholder="Ketik kode pada gambar" required />
	</div>
{:else if mode === 'provider'}
	<label class="captcha-field"
		>CAPTCHA token<input bind:value={answer} placeholder="Token CAPTCHA provider" required /></label
	>
{/if}

<style>
	.captcha-field {
		display: grid;
		gap: 8px;
		color: #55627a;
		font-size: 12px;
		font-weight: 700;
	}
	.captcha-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.captcha-head button {
		border: 0;
		color: #1769e0;
		background: transparent;
		cursor: pointer;
		font-size: 11px;
		font-weight: 700;
	}
	.captcha-field img {
		width: 180px;
		height: 58px;
		border: 1px solid #dce2ec;
		border-radius: 6px;
		object-fit: contain;
		background: #fff;
	}
	.captcha-field input {
		width: 100%;
		padding: 10px 12px;
		border: 1px solid #dce2ec;
		border-radius: 7px;
		font: inherit;
	}
</style>
