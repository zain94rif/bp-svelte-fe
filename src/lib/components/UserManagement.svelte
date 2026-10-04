<script lang="ts">
	import { apiRequest } from '$lib/api';
	import RegisterUserForm from '$lib/components/RegisterUserForm.svelte';
	import type { Role, User } from '$lib/types';
	import { onMount } from 'svelte';

	let users = $state<User[]>([]);
	let loading = $state(true);
	let error = $state('');
	let notice = $state('');
	let registerOpen = $state(false);
	let editing = $state<User | null>(null);
	let saving = $state(false);

	async function loadUsers() {
		loading = true;
		error = '';
		try {
			const result = await apiRequest<{ data: User[] }>('/api/v1/users');
			users = result?.data ?? [];
		} catch (err) {
			error = err instanceof Error ? err.message : 'Gagal mengambil daftar user';
		} finally {
			loading = false;
		}
	}

	async function updateUser(
		user: User,
		changes: { email?: string; role?: Role; active?: boolean; password?: string }
	) {
		saving = true;
		error = '';
		try {
			await apiRequest('/api/v1/users', {
				method: 'PUT',
				body: JSON.stringify({ id: user.id, ...changes })
			});
			notice = 'Data user berhasil diperbarui.';
			editing = null;
			await loadUsers();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Gagal memperbarui user';
		} finally {
			saving = false;
		}
	}

	async function deactivateUser(user: User) {
		if (!confirm(`Nonaktifkan user ${user.email}?`)) return;
		try {
			await apiRequest('/api/v1/users', {
				method: 'DELETE',
				body: JSON.stringify({ id: user.id })
			});
			notice = 'User berhasil dinonaktifkan.';
			await loadUsers();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Gagal menonaktifkan user';
		}
	}

	function openEdit(user: User) {
		editing = { ...user };
	}

	onMount(loadUsers);
</script>

<div class="content">
	<div class="heading-row">
		<div>
			<p class="eyebrow">ADMINISTRATION</p>
			<h1>Manajemen user</h1>
			<p class="subtitle">Kelola akun dan role pengguna aplikasi.</p>
		</div>
		<button class="primary-button" onclick={() => (registerOpen = true)}>Registrasi user</button>
	</div>
	{#if notice}<div class="alert success">{notice}</div>{/if}
	{#if error}<div class="alert danger">{error}</div>{/if}
	<section class="panel">
		<div class="table-container">
			<table>
				<thead><tr><th>Email</th><th>Role</th><th>Status</th><th>Aksi</th></tr></thead><tbody>
					{#if loading}<tr><td colspan="4">Memuat user...</td></tr>{:else if users.length === 0}<tr
							><td colspan="4">Belum ada user.</td></tr
						>{:else}{#each users as user (user.id)}<tr
								><td>{user.email}</td><td>{user.role}</td><td
									><span class:inactive={!user.active} class="status"
										>{user.active === false ? 'Nonaktif' : 'Aktif'}</span
									></td
								><td
									><button class="table-action" onclick={() => openEdit(user)}>Edit</button
									>{#if user.active !== false}<button
											class="table-action danger-action"
											onclick={() => deactivateUser(user)}>Nonaktifkan</button
										>{/if}</td
								></tr
							>{/each}{/if}
				</tbody>
			</table>
		</div>
	</section>
</div>

{#if registerOpen}<RegisterUserForm
		onClose={() => (registerOpen = false)}
		onSuccess={() => {
			notice = 'User berhasil dibuat.';
			loadUsers();
		}}
	/>{/if}
{#if editing}<div
		class="modal-backdrop"
		role="presentation"
		onclick={(event) => event.target === event.currentTarget && (editing = null)}
	>
		<form
			class="modal"
			onsubmit={(event) => {
				event.preventDefault();
				const target = event.currentTarget;
				const data = new FormData(target);
				updateUser(editing!, {
					email: String(data.get('email')),
					role: String(data.get('role')) as Role,
					active: data.get('active') === 'true',
					...(String(data.get('password')) ? { password: String(data.get('password')) } : {})
				});
			}}
		>
			<div class="modal-head">
				<h2>Edit user</h2>
				<button type="button" class="close" onclick={() => (editing = null)}>×</button>
			</div>
			<label>Email<input name="email" type="email" value={editing.email} required /></label><label
				>Role<select name="role" value={editing.role}
					><option>ADMIN</option><option>VIEWER</option></select
				></label
			><label
				>Status<select name="active" value={editing.active === false ? 'false' : 'true'}
					><option value="true">Aktif</option><option value="false">Nonaktif</option></select
				></label
			><label
				>Password baru<input
					name="password"
					type="password"
					minlength="8"
					placeholder="Kosongkan jika tidak diubah"
				/></label
			>
			<div class="modal-actions">
				<button type="button" class="secondary-button" onclick={() => (editing = null)}
					>Batal</button
				><button class="primary-button" disabled={saving}
					>{saving ? 'Menyimpan...' : 'Simpan'}</button
				>
			</div>
		</form>
	</div>{/if}

<style>
	.content {
		max-width: 1280px;
		margin: 0 auto;
		padding: 54px 24px 70px;
	}
	.heading-row {
		display: flex;
		justify-content: space-between;
		align-items: end;
		gap: 24px;
		margin-bottom: 32px;
	}
	.eyebrow {
		color: #7d8aa3;
		font-size: 10px;
		font-weight: 800;
		letter-spacing: 0.14em;
	}
	.heading-row h1 {
		margin: 0;
		color: #162136;
	}
	.subtitle {
		color: #7d889d;
		font-size: 14px;
	}
	.panel {
		overflow: hidden;
		border: 1px solid #e7ebf2;
		border-radius: 12px;
		background: #fff;
	}
	.table-container {
		overflow-x: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
	}
	th,
	td {
		padding: 15px 20px;
		border-bottom: 1px solid #eef1f5;
		text-align: left;
		font-size: 13px;
	}
	th {
		color: #8994a7;
		font-size: 10px;
		text-transform: uppercase;
	}
	.status {
		color: #137a4a;
	}
	.status.inactive {
		color: #b33b42;
	}
	.table-action {
		margin-right: 8px;
		border: 0;
		color: #1769e0;
		background: transparent;
		cursor: pointer;
		font-size: 12px;
		font-weight: 700;
	}
	.danger-action {
		color: #b33b42;
	}
	.primary-button,
	.secondary-button {
		border: 0;
		border-radius: 8px;
		padding: 11px 17px;
		cursor: pointer;
		font-weight: 700;
	}
	.primary-button {
		color: #fff;
		background: #1769e0;
	}
	.secondary-button {
		color: #41506a;
		background: #edf1f7;
	}
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
		width: min(500px, 100%);
		display: grid;
		gap: 15px;
		padding: 28px;
		border-radius: 13px;
		background: #fff;
	}
	.modal-head,
	.modal-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.modal-actions {
		justify-content: end;
		gap: 10px;
		margin-top: 10px;
	}
	.modal h2 {
		margin: 0;
	}
	.close {
		border: 0;
		background: transparent;
		font-size: 24px;
		cursor: pointer;
	}
	.modal label {
		color: #55627a;
		font-size: 12px;
		font-weight: 700;
	}
	.modal input,
	.modal select {
		display: block;
		width: 100%;
		margin-top: 6px;
		padding: 10px;
		border: 1px solid #dce2ec;
		border-radius: 7px;
		font: inherit;
	}
	:global(body.dark-mode) .panel,
	:global(body.dark-mode) .modal {
		background: #182235;
		border-color: #2b3950;
	}
	:global(body.dark-mode) .heading-row h1,
	:global(body.dark-mode) .modal h2 {
		color: #edf3ff;
	}
	:global(body.dark-mode) th,
	:global(body.dark-mode) td {
		border-color: #2b3950;
		color: #c7d2e3;
	}
	:global(body.dark-mode) .modal input,
	:global(body.dark-mode) .modal select {
		color: #dce4f2;
		background: #111b2c;
		border-color: #34445e;
	}
	@media (max-width: 640px) {
		.content {
			padding: 32px 14px;
		}
		.heading-row {
			align-items: start;
			flex-direction: column;
		}
	}
</style>
