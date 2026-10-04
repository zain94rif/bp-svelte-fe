<script lang="ts">
	import { login } from '$lib/api';
	import CaptchaField from '$lib/components/CaptchaField.svelte';
	import BackendSelector from '$lib/components/BackendSelector.svelte';
	import { PUBLIC_CAPTCHA_MODE, PUBLIC_CAPTCHA_REQUIRED } from '$env/static/public';
	import type { ApiError, AuthSession } from '$lib/types';

	let { onLogin }: { onLogin: (session: AuthSession) => void } = $props();
	let email = $state('');
	let password = $state('');
	let captcha = $state('');
	let captchaId = $state('');
	let captchaRefresh = $state(0);
	let loading = $state(false);
	let error = $state('');
	let fieldErrors = $state<{ email?: string; password?: string }>({});

	async function submit() {
		fieldErrors = {};
		if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
			fieldErrors.email = !email.trim() ? 'Email wajib diisi.' : 'Format email tidak valid.';
		}
		if (!password) fieldErrors.password = 'Password wajib diisi.';
		if (Object.keys(fieldErrors).length > 0) {
			return;
		}
		loading = true;
		error = '';
		const mode =
			PUBLIC_CAPTCHA_MODE || (PUBLIC_CAPTCHA_REQUIRED === 'true' ? 'provider' : 'disabled');
		try {
			onLogin(
				await login(
					email.trim(),
					password,
					mode === 'provider' ? captcha : '',
					mode === 'internal' ? { captcha_id: captchaId, captcha_answer: captcha } : undefined
				)
			);
		} catch (err) {
			const apiError = err as ApiError;
			if (mode === 'internal') {
				captchaId = '';
				captcha = '';
				captchaRefresh += 1;
			}
			error =
				apiError.code === 'CAPTCHA_REQUIRED' || apiError.code === 'UNAUTHORIZED'
					? 'Login atau CAPTCHA tidak valid. Silakan ulangi CAPTCHA.'
					: apiError.message;
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head><title>Login | BPJS Ketenagakerjaan</title></svelte:head>
<main class="login-page">
	<form
		class="login-card"
		onsubmit={(event) => {
			event.preventDefault();
			submit();
		}}
	>
		<div class="brand-mark">B</div>
		<p class="eyebrow">BPJS KETENAGAKERJAAN</p>
		<h1>Masuk ke dashboard</h1>
		<p class="login-subtitle">Kelola data karyawan dengan aman.</p>
		<BackendSelector />
		{#if error}<div class="alert danger">{error}</div>{/if}
		<label
			>Email<input
				class:error-input={fieldErrors.email}
				bind:value={email}
				type="email"
				autocomplete="email"
				placeholder="admin@example.com"
			/>{#if fieldErrors.email}<small class="field-error">{fieldErrors.email}</small>{/if}</label
		>
		<label
			>Password<input
				class:error-input={fieldErrors.password}
				bind:value={password}
				type="password"
				autocomplete="current-password"
				placeholder="Password"
			/>{#if fieldErrors.password}<small class="field-error">{fieldErrors.password}</small
				>{/if}</label
		>
		<CaptchaField bind:captchaId bind:answer={captcha} refreshToken={captchaRefresh} />
		<button class="primary-button" disabled={loading}>{loading ? 'Memproses...' : 'Masuk'}</button>
	</form>
</main>

<style>
	.login-page {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: 24px;
		background: #f5f7fb;
	}
	.login-card {
		width: min(420px, 100%);
		display: grid;
		gap: 16px;
		padding: 34px;
		border: 1px solid #e7ebf2;
		border-radius: 14px;
		background: #fff;
		box-shadow: 0 18px 50px #17203312;
	}
	.login-card .brand-mark {
		margin-bottom: 3px;
	}
	.login-card h1 {
		margin: -4px 0 0;
		color: #162136;
		font-size: 28px;
	}
	.login-subtitle {
		margin: -8px 0 7px;
		color: #7d889d;
		font-size: 13px;
	}
	.login-card label {
		color: #55627a;
		font-size: 12px;
		font-weight: 700;
	}
	.login-card input {
		display: block;
		width: 100%;
		margin-top: 7px;
	}
	.alert {
		padding: 11px 13px;
		border-radius: 7px;
		font-size: 12px;
	}
	.danger {
		color: #b33b42;
		background: #fff0f0;
	}
	.field-error {
		display: block;
		margin-top: 5px;
		color: #c03945;
		font-size: 11px;
		font-weight: 600;
	}
	.error-input {
		border-color: #c03945 !important;
		background: #fff8f8 !important;
	}
	:global(body.dark-mode) .login-page {
		background: #101827;
	}
	.login-card {
		color: #dce4f2;
	}
	:global(body.dark-mode) .login-card {
		background: #182235;
		border-color: #2b3950;
	}
	.login-card :global(input) {
		border: 1px solid #dce2ec;
		border-radius: 7px;
		padding: 10px 12px;
		background: #fff;
		color: #27344b;
		font: inherit;
	}
	.primary-button {
		border: 0;
		border-radius: 8px;
		padding: 11px 17px;
		color: #fff;
		background: #1769e0;
		cursor: pointer;
		font-weight: 700;
	}
	.primary-button:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}
</style>
