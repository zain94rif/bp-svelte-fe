<script lang="ts">
	import { apiRequest } from '$lib/api';

	let { onClose, onSuccess }: { onClose: () => void; onSuccess: () => void } = $props();
	let email = $state('');
	let password = $state('');
	let role = $state<'ADMIN' | 'VIEWER'>('VIEWER');
	let error = $state('');
	let fieldErrors = $state<{ email?: string; password?: string }>({});
	let saving = $state(false);

	async function submit() {
		if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || password.length < 8) {
			fieldErrors = {};
			if (!email.trim()) fieldErrors.email = 'Email wajib diisi.';
			else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
				fieldErrors.email = 'Format email tidak valid.';
			if (password.length < 8) fieldErrors.password = 'Password minimal 8 karakter.';
			return;
		}
		saving = true;
		error = '';
		fieldErrors = {};
		try {
			await apiRequest('/api/v1/users', {
				method: 'POST',
				body: JSON.stringify({ email: email.trim(), password, role })
			});
			onSuccess();
			onClose();
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Gagal membuat user';
			if (/email/i.test(message)) fieldErrors.email = message;
			else if (/password/i.test(message)) fieldErrors.password = message;
			else error = message;
		} finally {
			saving = false;
		}
	}
</script>

<div
	class="modal-backdrop"
	role="presentation"
	onclick={(event) => event.target === event.currentTarget && onClose()}
>
	<form
		class="modal register-modal"
		onsubmit={(event) => {
			event.preventDefault();
			submit();
		}}
	>
		<div class="modal-head">
			<div>
				<p class="eyebrow">ADMINISTRATION</p>
				<h2>Registrasi user</h2>
			</div>
			<button type="button" class="close" onclick={onClose}>×</button>
		</div>
		{#if error}<div class="alert danger">{error}</div>{/if}
		<div class="form-grid">
			<label class="wide"
				>Email<input
					class:error-input={fieldErrors.email}
					bind:value={email}
					type="email"
					placeholder="viewer@example.com"
				/>{#if fieldErrors.email}<small class="field-error">{fieldErrors.email}</small>{/if}</label
			>
			<label
				>Password<input
					bind:value={password}
					type="password"
					placeholder="Minimal 8 karakter"
				/>{#if fieldErrors.password}<small class="field-error">{fieldErrors.password}</small
					>{/if}</label
			>
			<label
				>Role<select bind:value={role}
					><option value="VIEWER">VIEWER</option><option value="ADMIN">ADMIN</option></select
				></label
			>
		</div>
		<div class="modal-actions">
			<button type="button" class="secondary-button" onclick={onClose}>Batal</button><button
				class="primary-button"
				disabled={saving}>{saving ? 'Membuat...' : 'Buat user'}</button
			>
		</div>
	</form>
</div>

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 20;
		display: grid;
		place-items: center;
		padding: 20px;
		background: #17203366;
	}
	.modal {
		width: min(620px, 100%);
		padding: 28px;
		border-radius: 13px;
		background: #fff;
		box-shadow: 0 20px 60px #17203333;
	}
	.modal-head,
	.modal-actions {
		display: flex;
		justify-content: space-between;
		align-items: start;
	}
	.modal-actions {
		justify-content: end;
		gap: 10px;
		margin-top: 26px;
	}
	.modal h2 {
		margin: 0;
		color: #162136;
	}
	.close {
		border: 0;
		background: transparent;
		font-size: 26px;
		cursor: pointer;
	}
	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px 14px;
	}
	.form-grid label {
		color: #55627a;
		font-size: 12px;
		font-weight: 700;
	}
	.form-grid .wide {
		grid-column: 1 / -1;
	}
	.form-grid input,
	.form-grid select {
		display: block;
		width: 100%;
		margin-top: 7px;
		padding: 10px 12px;
		border: 1px solid #dce2ec;
		border-radius: 7px;
		font: inherit;
	}
	.danger {
		padding: 11px;
		margin: 18px 0;
		color: #b33b42;
		background: #fff0f0;
		border-radius: 7px;
		font-size: 12px;
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
		background: #fff8f8;
	}
	:global(body.dark-mode) .modal {
		background: #182235;
	}
	@media (max-width: 640px) {
		.form-grid {
			grid-template-columns: 1fr;
		}
		.form-grid .wide {
			grid-column: auto;
		}
		.modal {
			padding: 21px;
		}
	}
</style>
