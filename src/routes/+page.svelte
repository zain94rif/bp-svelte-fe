<script lang="ts">
	import { apiBlob, apiRequest, getSession, logout as logoutApi } from '$lib/api';
	import AppShell from '$lib/components/AppShell.svelte';
	import DocumentPreview from '$lib/components/DocumentPreview.svelte';
	import EmployeeForm from '$lib/components/EmployeeForm.svelte';
	import LoginForm from '$lib/components/LoginForm.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import RegisterUserForm from '$lib/components/RegisterUserForm.svelte';
	import UserManagement from '$lib/components/UserManagement.svelte';
	import type {
		AuthSession,
		Employee,
		EmployeeDocument,
		EmployeeForm as EmployeeFormData
	} from '$lib/types';
	import { onMount } from 'svelte';

	const PAGE_SIZE = 20;

	const fields = [
		{ value: 'all', label: 'Semua field' },
		{ value: 'nik', label: 'NIK' },
		{ value: 'kpj', label: 'KPJ' },
		{ value: 'full_name', label: 'Nama lengkap' },
		{ value: 'phone', label: 'No. HP' },
		{ value: 'email', label: 'Email' },
		{ value: 'birth_place', label: 'Tempat lahir' },
		{ value: 'birth_date', label: 'Tanggal lahir' },
		{ value: 'address', label: 'Alamat' }
	];

	const emptyForm = (): EmployeeFormData => ({
		nik: '',
		kpj: '',
		full_name: '',
		phone: '',
		email: '',
		birth_place: '',
		birth_date: '',
		address: ''
	});

	let employees = $state<Employee[]>([]);
	let session = $state<AuthSession | null>(null);
	let total = $state(0);
	let page = $state(1);
	let search = $state('');
	let field = $state('all');
	let loading = $state(true);
	let error = $state('');
	let notice = $state('');
	let modal = $state<'create' | 'edit' | null>(null);
	let registerModal = $state(false);
	let activePage = $state<'employees' | 'users'>('employees');
	let selected = $state<Employee | null>(null);
	let form = $state<EmployeeFormData>(emptyForm());
	let formErrors = $state<Partial<Record<keyof EmployeeFormData, string>>>({});
	let saving = $state(false);
	let photoFile = $state<File | null>(null);
	let deleting = $state('');
	let documents = $state<EmployeeDocument[]>([]);
	let documentsLoading = $state(false);
	let documentSaving = $state(false);
	let documentFile = $state<File | null>(null);
	let previewDocument = $state<EmployeeDocument | null>(null);
	let darkMode = $state(false);

	let totalPages = $derived(Math.max(1, Math.ceil(total / PAGE_SIZE)));

	async function loadEmployees() {
		loading = true;
		error = '';
		try {
			const params = new URLSearchParams({
				search: search.trim(),
				field,
				page: String(page),
				limit: String(PAGE_SIZE)
			});
			const result = await apiRequest<{ data: Employee[]; meta: { total: number } }>(
				`/api/v1/employees?${params}`
			);
			employees = result?.data ?? [];
			total = result?.meta?.total ?? 0;
			if (page > totalPages && totalPages > 0) {
				page = totalPages;
				await loadEmployees();
			}
		} catch (err) {
			const code = (err as { code?: string }).code;
			if ((err as { status?: number }).status === 401) {
				session = null;
				error = 'Sesi berakhir. Silakan login kembali.';
			} else {
				error =
					code === 'DUPLICATE_PHONE'
						? 'Nomor HP sudah digunakan employee lain.'
						: code === 'DUPLICATE_EMAIL'
							? 'Email sudah digunakan employee lain.'
							: err instanceof Error
								? err.message
								: 'Gagal mengambil data employee';
			}
			employees = [];
			total = 0;
		} finally {
			loading = false;
		}
	}

	function runSearch() {
		page = 1;
		loadEmployees();
	}

	function openCreate() {
		selected = null;
		form = emptyForm();
		formErrors = {};
		modal = 'create';
		notice = '';
		error = '';
	}

	function navigate(pageName: 'employees' | 'users') {
		activePage = pageName;
	}

	function openEdit(employee: Employee) {
		selected = employee;
		form = {
			nik: employee.nik ?? '',
			kpj: employee.kpj ?? '',
			full_name: employee.full_name ?? '',
			phone: employee.phone ?? '',
			email: employee.email ?? '',
			birth_place: employee.birth_place ?? '',
			birth_date: employee.birth_date ? employee.birth_date.slice(0, 10) : '',
			address: employee.address ?? ''
		};
		formErrors = {};
		modal = 'edit';
		notice = '';
		error = '';
	}

	function closeModal() {
		if (!saving) {
			modal = null;
			selected = null;
			formErrors = {};
		}
	}

	function payload() {
		return Object.fromEntries(
			Object.entries(form).map(([key, value]) => [key, value?.trim() ? value.trim() : null])
		);
	}

	async function saveEmployee() {
		saving = true;
		error = '';
		const action = modal;
		try {
			const result = await apiRequest<{ data: Employee }>(
				action === 'edit' && selected ? '/api/v1/employees' : '/api/v1/employees',
				{
					method: action === 'edit' ? 'PUT' : 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(
						action === 'edit' && selected ? { id: selected.id, ...payload() } : payload()
					)
				}
			);
			const savedEmployee = result?.data ?? selected;
			if (photoFile && savedEmployee) {
				const photoBody = new FormData();
				photoBody.append('file', photoFile);
				await apiRequest(`/api/v1/employees/${savedEmployee.id}/photo`, {
					method: 'POST',
					body: photoBody
				});
			}
			modal = null;
			selected = null;
			photoFile = null;
			notice =
				action === 'edit'
					? 'Data employee berhasil diperbarui.'
					: 'Employee baru berhasil ditambahkan.';
			await loadEmployees();
		} catch (err) {
			const code = (err as { code?: string }).code;
			const message =
				code === 'DUPLICATE_NIK'
					? 'NIK sudah digunakan employee lain.'
					: code === 'DUPLICATE_KPJ'
						? 'KPJ sudah digunakan employee lain.'
						: code === 'DUPLICATE_PHONE'
							? 'Nomor HP sudah digunakan employee lain.'
							: code === 'DUPLICATE_EMAIL'
								? 'Email sudah digunakan employee lain.'
								: err instanceof Error
									? err.message
									: 'Gagal menyimpan employee';
			formErrors =
				code === 'DUPLICATE_NIK'
					? { nik: message }
					: code === 'DUPLICATE_KPJ'
						? { kpj: message }
						: code === 'DUPLICATE_PHONE'
							? { phone: message }
							: code === 'DUPLICATE_EMAIL'
								? { email: message }
								: {};
			error = message;
		} finally {
			saving = false;
		}
	}

	async function removeEmployee(employee: Employee) {
		if (!confirm(`Hapus employee ${employee.full_name}?`)) return;
		deleting = employee.id;
		error = '';
		try {
			await apiRequest('/api/v1/employees', {
				method: 'DELETE',
				body: JSON.stringify({ id: employee.id })
			});
			notice = 'Employee berhasil dihapus.';
			await loadEmployees();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Gagal menghapus employee';
		} finally {
			deleting = '';
		}
	}

	async function loadDocuments(employee: Employee) {
		selected = employee;
		documentsLoading = true;
		documents = [];
		try {
			const result = await apiRequest<{ data: EmployeeDocument[] }>(
				`/api/v1/employees/${employee.id}/documents`
			);
			documents = result?.data ?? [];
		} catch (err) {
			error = err instanceof Error ? err.message : 'Gagal mengambil dokumen';
		} finally {
			documentsLoading = false;
		}
	}

	async function addDocument() {
		if (!selected || !documentFile) return;
		documentSaving = true;
		error = '';
		try {
			const body = new FormData();
			body.append('file', documentFile);
			await apiRequest(`/api/v1/employees/${selected.id}/documents/upload`, {
				method: 'POST',
				body
			});
			documentFile = null;
			await loadDocuments(selected);
			notice = 'Metadata dokumen berhasil disimpan.';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Gagal menyimpan dokumen';
		} finally {
			documentSaving = false;
		}
	}

	async function openDocument(
		employeeId: string,
		documentId: string,
		action: 'preview' | 'download'
	) {
		try {
			const blob = await apiBlob(
				`/api/v1/employees/${employeeId}/documents/${documentId}/${action}`
			);
			const url = URL.createObjectURL(blob);
			if (action === 'download') {
				const link = document.createElement('a');
				link.href = url;
				link.download = 'ijazah';
				link.click();
				link.remove();
				URL.revokeObjectURL(url);
			} else {
				window.open(url, '_blank', 'noopener,noreferrer');
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'File tidak dapat diakses';
		}
	}

	function onLogin(value: AuthSession) {
		session = value;
		loadEmployees();
	}

	async function signOut() {
		await logoutApi();
		session = null;
		employees = [];
	}

	function formatSize(bytes: number) {
		if (!bytes) return '-';
		return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
	}

	function toggleDarkMode() {
		darkMode = !darkMode;
		document.body.classList.toggle('dark-mode', darkMode);
		localStorage.setItem('bpjs-theme', darkMode ? 'dark' : 'light');
	}

	onMount(() => {
		darkMode = localStorage.getItem('bpjs-theme') === 'dark';
		document.body.classList.toggle('dark-mode', darkMode);
		session = getSession();
		if (session) loadEmployees();
	});
</script>

<svelte:head>
	<title>Data Karyawan | BPJS</title>
	<meta name="description" content="Manajemen data employee BPJS" />
</svelte:head>

{#if !session}
	<LoginForm {onLogin} />
{:else}
	<AppShell
		user={session!.user}
		{darkMode}
		{activePage}
		onToggleTheme={toggleDarkMode}
		onLogout={signOut}
		onNavigate={navigate}
	>
		{#if activePage === 'employees'}
			<main class="content">
				<div class="heading-row">
					<div>
						<!-- <p class="eyebrow">MANAGEMENT BPJS KETENAGAKERJAAN</p> -->
						<h1>Management Data Karyawan</h1>
						<!-- <p class="subtitle">Kelola informasi Karyawan dalam satu tempat.</p> -->
					</div>
					<div class="heading-actions">
						{#if session!.user.role === 'ADMIN'}<button class="primary-button" onclick={openCreate}
								><span class="plus">+</span> Tambah Karyawan</button
							>{/if}
						<!-- {#if session!.user.role === 'ADMIN'}<button
								class="secondary-button"
								onclick={() => (registerModal = true)}>Registrasi user</button
							>{/if}
						<button class="secondary-button" onclick={signOut}
							>Keluar ({session!.user.email})</button
						> -->
					</div>
				</div>

				{#if notice}<div class="alert success">
						{notice}<button onclick={() => (notice = '')}>×</button>
					</div>{/if}
				{#if error}<div class="alert danger">
						{error}<button onclick={() => (error = '')}>×</button>
					</div>{/if}

				<section class="panel">
					<div class="toolbar">
						<div class="search-wrap">
							<span class="search-icon">⌕</span>
							<input
								bind:value={search}
								onkeydown={(event) => event.key === 'Enter' && runSearch()}
								placeholder="Cari employee..."
								aria-label="Cari employee"
							/>
						</div>
						<select bind:value={field} onchange={runSearch} aria-label="Field pencarian">
							{#each fields as item (item.value)}<option value={item.value}>{item.label}</option
								>{/each}
						</select>
						<button class="secondary-button" onclick={runSearch}>Cari</button>
					</div>

					<div class="table-container">
						<table>
							<thead
								><tr
									><th>Karyawan</th><th>NIK</th><th>KPJ</th><th>Kontak</th><th>Alamat</th><th
										class="action-header">Aksi</th
									></tr
								></thead
							>
							<tbody>
								{#if loading}
									{#each [0, 1, 2, 3, 4] as index (index)}<tr class="skeleton-row"
											><td colspan="6"><span></span></td></tr
										>{/each}
								{:else if employees.length === 0}
									<tr
										><td colspan="6"
											><div class="empty">
												<div class="empty-icon">◎</div>
												<strong>Belum ada employee</strong><span
													>Coba ubah kata kunci pencarian atau tambahkan employee baru.</span
												>
											</div></td
										></tr
									>
								{:else}
									{#each employees as employee (employee.id)}
										<tr>
											<td
												><div class="person">
													<div class="avatar">{employee.full_name.charAt(0).toUpperCase()}</div>
													<div>
														<strong>{employee.full_name}</strong><small
															>{employee.birth_place || 'Tempat lahir belum diisi'}</small
														>
													</div>
												</div></td
											>
											<td class="mono">{employee.nik}</td><td class="mono">{employee.kpj}</td>
											<td
												><strong>{employee.phone || '-'}</strong><small
													>{employee.email || 'Email belum diisi'}</small
												></td
											>
											<td>{employee.address}</td>
											<td
												><div class="actions">
													<button
														title={`Lihat dokumen ${employee.full_name}`}
														aria-label={`Lihat dokumen ${employee.full_name}`}
														onclick={() => loadDocuments(employee)}
													>
														File
													</button>
													{#if session!.user.role === 'ADMIN'}<button
															title={`Edit ${employee.full_name}`}
															aria-label={`Edit ${employee.full_name}`}
															onclick={() => openEdit(employee)}
														>
															Edit
														</button><button
															class="delete"
															title={`Hapus ${employee.full_name}`}
															aria-label={`Hapus ${employee.full_name}`}
															onclick={() => removeEmployee(employee)}
															disabled={deleting === employee.id}
															>{deleting === employee.id ? '…' : ' Hapus '}</button
														>{/if}
												</div></td
											>
										</tr>
									{/each}
								{/if}
							</tbody>
						</table>
					</div>
					<div class="table-footer">
						<span
							>Menampilkan <strong
								>{employees.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(
									page * PAGE_SIZE,
									(page - 1) * PAGE_SIZE + employees.length
								)}</strong
							>
							dari <strong>{total}</strong> employee</span
						>
						<Pagination
							{page}
							{totalPages}
							disabled={loading}
							onPageChange={(nextPage) => {
								page = nextPage;
								loadEmployees();
							}}
						/>
					</div>
				</section>
			</main>
		{:else}
			<UserManagement />
		{/if}
	</AppShell>

	{#if modal}
		<div
			class="modal-backdrop"
			role="presentation"
			onclick={(event) => event.target === event.currentTarget && closeModal()}
		>
			<div class="modal" role="dialog" aria-modal="true" aria-labelledby="employee-form-title">
				<div class="modal-head">
					<div>
						<p class="eyebrow">{modal === 'edit' ? 'UPDATE DATA' : 'NEW RECORD'}</p>
						<h2 id="employee-form-title">
							{modal === 'edit' ? 'Edit employee' : 'Tambah karyawan'}
						</h2>
					</div>
					<button class="close" onclick={closeModal}>×</button>
				</div>
				<EmployeeForm
					mode={modal === 'edit' ? 'edit' : 'create'}
					initial={form}
					errors={formErrors}
					{saving}
					onCancel={closeModal}
					onSave={(nextForm, nextPhoto) => {
						form = nextForm;
						photoFile = nextPhoto;
						formErrors = {};
						saveEmployee();
					}}
				/>
			</div>
		</div>
	{/if}

	{#if selected && !modal}
		<div
			class="modal-backdrop"
			role="presentation"
			onclick={(event) => event.target === event.currentTarget && (selected = null)}
		>
			<div
				class="modal document-modal"
				role="dialog"
				aria-modal="true"
				aria-labelledby="document-title"
			>
				<div class="modal-head">
					<div>
						<p class="eyebrow">EMPLOYEE DOCUMENTS</p>
						<h2 id="document-title">{selected.full_name}</h2>
					</div>
					<button class="close" onclick={() => (selected = null)}>×</button>
				</div>
				{#if documentsLoading}<p class="muted">
						Memuat dokumen...
					</p>{:else if documents.length === 0}<p class="muted">
						Belum ada metadata dokumen.
					</p>{:else}<div class="document-list">
						{#each documents as doc (doc.id)}<div>
								<span class="file-icon">▤</span>
								<div>
									<strong>{doc.file_name}</strong><small
										>{doc.type} · {formatSize(doc.file_size)}</small
									>
								</div>
								<div class="document-actions">
									<button onclick={() => (previewDocument = doc)}>Preview</button>
									<button onclick={() => selected && openDocument(selected.id, doc.id, 'download')}
										>Download</button
									>
								</div>
							</div>{/each}
					</div>{/if}
				{#if session!.user.role === 'ADMIN'}<div class="document-form">
						<h3>Tambah metadata</h3>
						<input
							type="file"
							accept=".pdf,image/jpeg,image/png"
							onchange={(event) => (documentFile = event.currentTarget.files?.[0] ?? null)}
						/>
						<button
							class="primary-button"
							onclick={addDocument}
							disabled={documentSaving || !documentFile}
							>{documentSaving ? 'Mengunggah...' : 'Upload ijazah'}</button
						>
					</div>{/if}
			</div>
		</div>
	{/if}
	{#if registerModal}
		<RegisterUserForm
			onClose={() => (registerModal = false)}
			onSuccess={() => (notice = 'User berhasil dibuat.')}
		/>
	{/if}
{/if}
{#if previewDocument && selected}
	<DocumentPreview
		employeeId={selected.id}
		document={previewDocument}
		onClose={() => (previewDocument = null)}
	/>
{/if}

<style>
	:global(*) {
		box-sizing: border-box;
	}
	:global(body) {
		margin: 0;
		background: #f5f7fb;
		color: #172033;
		font-family:
			Inter,
			ui-sans-serif,
			system-ui,
			-apple-system,
			sans-serif;
	}
	:global(button),
	:global(input),
	:global(select),
	:global(textarea) {
		font: inherit;
	}
	.content {
		max-width: 1280px;
		margin: 0 auto;
		padding: 54px 24px 70px;
	}
	.heading-row {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 24px;
		margin-bottom: 32px;
	}
	.eyebrow {
		color: #7d8aa3;
		font-size: 10px;
		font-weight: 800;
		letter-spacing: 0.14em;
		margin: 0 0 10px;
	}
	.heading-row h1,
	.modal h2 {
		margin: 0;
		color: #162136;
		letter-spacing: -0.035em;
	}
	.heading-row h1 {
		font-size: clamp(28px, 4vw, 38px);
	}
	.primary-button,
	.secondary-button {
		border: 0;
		border-radius: 8px;
		cursor: pointer;
		font-weight: 700;
		padding: 11px 17px;
		transition: 0.2s ease;
	}
	.primary-button {
		color: white;
		background: #1769e0;
		box-shadow: 0 5px 12px #1769e01f;
	}
	.primary-button:hover {
		background: #0d58c5;
	}
	.secondary-button {
		color: #41506a;
		background: #edf1f7;
	}
	.secondary-button:hover {
		background: #e1e7f0;
	}
	.primary-button:disabled,
	.secondary-button:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}
	.plus {
		font-size: 20px;
		line-height: 10px;
		vertical-align: -2px;
		margin-right: 6px;
	}
	.alert {
		padding: 12px 16px;
		border-radius: 8px;
		margin: -14px 0 20px;
		font-size: 13px;
		display: flex;
		justify-content: space-between;
	}
	.alert button {
		background: none;
		border: 0;
		font-size: 18px;
		cursor: pointer;
	}
	.success {
		color: #137a4a;
		background: #e8f8f0;
	}
	.danger {
		color: #b33b42;
		background: #fff0f0;
	}
	.panel {
		overflow: hidden;
		border: 1px solid #e7ebf2;
		border-radius: 12px;
		background: #fff;
		box-shadow: 0 10px 28px #17203308;
	}
	.toolbar {
		display: flex;
		gap: 10px;
		padding: 20px;
		border-bottom: 1px solid #edf0f5;
	}
	.search-wrap {
		position: relative;
		flex: 1;
	}
	.search-wrap input {
		width: 100%;
		padding-left: 38px;
	}
	.search-icon {
		position: absolute;
		left: 14px;
		top: 9px;
		color: #8591a7;
		font-size: 22px;
		transform: rotate(-20deg);
	}
	.toolbar select {
		width: 180px;
	}
	input,
	select,
	textarea {
		border: 1px solid #dce2ec;
		border-radius: 7px;
		outline: none;
		color: #27344b;
		background: #fff;
		padding: 10px 12px;
		font-size: 13px;
	}
	.toolbar input {
		height: 40px;
	}
	.toolbar select {
		height: 40px;
	}
	.form-grid input,
	.form-grid textarea {
		margin-top: 7px;
		width: 100%;
	}
	.form-grid textarea {
		resize: vertical;
	}
	.form-grid label {
		color: #55627a;
		font-size: 12px;
		font-weight: 700;
	}
	.form-grid label.wide {
		grid-column: 1 / -1;
	}
	.optional {
		color: #9aa5b8;
		font-weight: 400;
	}
	.table-container {
		max-height: min(560px, calc(100vh - 330px));
		overflow: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		min-width: 880px;
	}
	th {
		position: sticky;
		top: 0;
		z-index: 1;
		padding: 14px 20px;
		text-align: left;
		color: #8994a7;
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		background: #fafbfc;
	}
	th:first-child,
	td:first-child {
		position: sticky;
		left: 0;
		z-index: 2;
		background: #fff;
	}
	th:first-child {
		z-index: 3;
		background: #fafbfc;
	}
	td:first-child {
		box-shadow: 8px 0 12px -12px #17203366;
	}
	td {
		padding: 16px 20px;
		border-top: 1px solid #f0f2f6;
		color: #59667d;
		font-size: 12px;
		white-space: nowrap;
	}
	td small,
	.person small {
		display: block;
		margin-top: 4px;
		color: #98a2b3;
		font-size: 11px;
	}
	.person {
		display: flex;
		align-items: center;
		gap: 11px;
	}
	.person strong,
	td strong {
		color: #29364c;
		font-size: 13px;
	}
	.avatar {
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		border-radius: 9px;
		background: #e3efff;
		color: #1769e0;
		font-size: 13px;
		font-weight: 800;
	}
	.mono {
		font-family: ui-monospace, SFMono-Regular, monospace;
		font-size: 11px;
		color: #53627b;
	}
	.action-header {
		text-align: right;
	}
	.actions {
		display: flex;
		justify-content: end;
		gap: 4px;
	}
	.actions button,
	.close {
		border: 0;
		background: transparent;
		color: #8792a5;
		cursor: pointer;
		font-size: 16px;
		padding: 6px 8px;
		border-radius: 5px;
	}
	.actions button:hover {
		background: #eef4ff;
		color: #1769e0;
	}
	.actions .delete:hover {
		background: #fff0f0;
		color: #d54b55;
	}
	.skeleton-row span {
		display: block;
		height: 17px;
		border-radius: 5px;
		background: linear-gradient(90deg, #f0f2f6 25%, #fafbfc 50%, #f0f2f6 75%);
		background-size: 200% 100%;
		animation: shimmer 1.4s infinite;
	}
	@keyframes shimmer {
		to {
			background-position: -200% 0;
		}
	}
	.empty {
		display: grid;
		justify-items: center;
		gap: 8px;
		padding: 64px 20px;
		color: #7e899d;
	}
	.empty-icon {
		font-size: 30px;
		color: #b7c2d2;
	}
	.empty strong {
		color: #455269;
	}
	.empty span {
		font-size: 12px;
	}
	.table-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 17px 20px;
		color: #929caf;
		font-size: 11px;
	}
	.table-footer strong {
		color: #536078;
	}
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 10;
		display: grid;
		place-items: center;
		padding: 20px;
		background: #17203366;
	}
	.modal {
		width: min(620px, 100%);
		max-height: calc(100vh - 40px);
		overflow: auto;
		border-radius: 13px;
		padding: 28px;
		background: #fff;
		box-shadow: 0 20px 60px #17203333;
	}
	.modal-head {
		display: flex;
		justify-content: space-between;
		align-items: start;
		margin-bottom: 25px;
	}
	.modal h2 {
		font-size: 24px;
	}
	.close {
		font-size: 26px;
		padding: 0;
		line-height: 1;
	}
	.form-grid {
		display: grid;
		grid-template-columns: 180px 1fr 1fr;
		gap: 17px 14px;
	}
	.photo-upload {
		grid-row: span 2;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 175px;
		padding: 12px;
		border: 1px dashed #b8c8df;
		border-radius: 10px;
		text-align: center;
	}
	.photo-preview {
		display: grid;
		place-items: center;
		width: 72px;
		height: 72px;
		margin: 10px 0;
		border-radius: 50%;
		color: #1769e0;
		background: #e3efff;
		font-size: 25px;
		font-weight: 800;
	}
	.photo-upload input {
		width: 100%;
		font-size: 10px;
	}
	.modal-actions {
		display: flex;
		justify-content: end;
		gap: 10px;
		margin-top: 27px;
	}
	.document-modal {
		width: min(650px, 100%);
	}
	.muted {
		color: #8994a7;
		font-size: 13px;
	}
	.document-list {
		display: grid;
		gap: 8px;
		margin-bottom: 26px;
	}
	.document-list > div {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px;
		border: 1px solid #edf0f5;
		border-radius: 8px;
	}
	.file-icon {
		color: #1769e0;
		font-size: 20px;
	}
	.document-form {
		border-top: 1px solid #edf0f5;
		padding-top: 20px;
	}
	.document-form h3 {
		margin: 0 0 16px;
		font-size: 14px;
		color: #38465d;
	}
	.document-form .primary-button {
		margin-top: 17px;
	}
	@media (max-width: 640px) {
		.content {
			padding: 34px 14px;
		}
		.heading-row {
			align-items: start;
			flex-direction: column;
		}
		.toolbar {
			flex-wrap: wrap;
		}
		.toolbar select {
			flex: 1;
			width: auto;
		}
		.toolbar .secondary-button {
			width: 100%;
		}
		.table-footer {
			align-items: start;
			flex-direction: column;
			gap: 14px;
		}
		.table-container {
			max-height: calc(100vh - 360px);
			min-height: 180px;
		}
		.form-grid {
			grid-template-columns: 1fr;
		}
		.photo-upload {
			grid-row: auto;
		}
		.form-grid label.wide {
			grid-column: auto;
		}
		.modal {
			padding: 21px;
		}
	}
	:global(body.dark-mode) {
		background: #101827;
		color: #dce4f2;
	}
	:global(body.dark-mode) .panel,
	:global(body.dark-mode) .modal {
		background: #182235;
		border-color: #2b3950;
	}
	:global(body.dark-mode) .heading-row h1,
	:global(body.dark-mode) .modal h2,
	:global(body.dark-mode) .person strong,
	:global(body.dark-mode) td strong {
		color: #edf3ff;
	}
	:global(body.dark-mode) td,
	:global(body.dark-mode) .muted {
		color: #9eacc2;
	}
	:global(body.dark-mode) input,
	:global(body.dark-mode) select,
	:global(body.dark-mode) textarea {
		color: #dce4f2;
		background: #111b2c;
		border-color: #34445e;
	}
	:global(body.dark-mode) .toolbar,
	:global(body.dark-mode) th,
	:global(body.dark-mode) td,
	:global(body.dark-mode) .document-form {
		border-color: #2b3950;
	}
	:global(body.dark-mode) th {
		background: #141e30;
		color: #9eacc2;
	}
	:global(body.dark-mode) th:first-child,
	:global(body.dark-mode) td:first-child {
		background: #182235;
	}
	:global(body.dark-mode) th:first-child {
		background: #141e30;
	}
	:global(body.dark-mode) .table-container {
		scrollbar-color: #52627c #182235;
	}
	:global(body.dark-mode) .secondary-button {
		color: #dce4f2;
		background: #26344b;
		border-color: #3a4b66;
	}
	:global(body.dark-mode) .document-list > div {
		border-color: #2b3950;
	}
</style>
