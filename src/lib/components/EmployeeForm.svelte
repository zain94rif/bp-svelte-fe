<script lang="ts">
	import type { EmployeeForm as EmployeeFormType } from '$lib/types';
	let {
		mode,
		initial,
		errors = {},
		saving = false,
		onSave,
		onCancel
	}: {
		mode: 'create' | 'edit';
		initial: EmployeeFormType;
		errors?: Partial<Record<keyof EmployeeFormType, string>>;
		saving?: boolean;
		onSave: (form: EmployeeFormType, photo: File | null) => void;
		onCancel: () => void;
	} = $props();
	let form = $state<EmployeeFormType>({ ...initial });
	let photo = $state<File | null>(null);
	let fieldErrors = $state<Partial<Record<keyof EmployeeFormType, string>>>({});

	function maxBirthDate() {
		const date = new Date();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${date.getFullYear() - 16}-${month}-${day}`;
	}

	function submit() {
		fieldErrors = {};
		if (!form.nik.trim()) fieldErrors.nik = 'NIK wajib diisi.';
		else if (!/^\d{16}$/.test(form.nik.trim()))
			fieldErrors.nik = 'NIK harus terdiri dari tepat 16 digit.';
		if (!form.kpj.trim()) fieldErrors.kpj = 'KPJ wajib diisi.';
		if (!form.full_name.trim()) fieldErrors.full_name = 'Nama lengkap wajib diisi.';
		if (!form.phone.trim()) fieldErrors.phone = 'Nomor HP wajib diisi.';
		if (!form.email.trim()) fieldErrors.email = 'Email wajib diisi.';
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
			fieldErrors.email = 'Format email tidak valid.';
		if (!form.birth_place.trim()) fieldErrors.birth_place = 'Tempat lahir wajib diisi.';
		if (!form.birth_date) fieldErrors.birth_date = 'Tanggal lahir wajib diisi.';
		else if (form.birth_date > maxBirthDate())
			fieldErrors.birth_date = 'Karyawan harus berusia minimal 16 tahun.';
		if (!form.address.trim()) fieldErrors.address = 'Alamat wajib diisi.';
		if (Object.keys(fieldErrors).length > 0) return;
		onSave(form, photo);
	}

	function errorFor(field: keyof EmployeeFormType) {
		return fieldErrors[field] ?? errors[field];
	}
</script>

<form
	class="form-panel"
	onsubmit={(event) => {
		event.preventDefault();
		submit();
	}}
>
	<div class="form-grid">
		<div class="photo-box">
			<div class="photo-preview">{photo ? '✓' : 'B'}</div>
			<strong>Foto karyawan</strong><small>JPG/PNG, opsional</small>
			<input
				type="file"
				accept="image/jpeg,image/png"
				onchange={(event) => (photo = event.currentTarget.files?.[0] ?? null)}
			/>
		</div>
		<label
			>NIK *<input
				class:error-input={errorFor('nik')}
				bind:value={form.nik}
				maxlength="16"
				placeholder="16 digit NIK"
			/>{#if errorFor('nik')}<small class="field-error">{errorFor('nik')}</small>{/if}</label
		>
		<label
			>KPJ *<input
				class:error-input={errorFor('kpj')}
				bind:value={form.kpj}
				maxlength="50"
				placeholder="Nomor KPJ"
			/>{#if errorFor('kpj')}<small class="field-error">{errorFor('kpj')}</small>{/if}</label
		>
		<label class="wide"
			>Nama lengkap *<input
				bind:value={form.full_name}
				maxlength="150"
				placeholder="Nama karyawan"
			/>{#if errorFor('full_name')}<small class="field-error">{errorFor('full_name')}</small
				>{/if}</label
		>
		<label
			>No. HP *<input
				class:error-input={errorFor('phone')}
				bind:value={form.phone}
				maxlength="30"
				placeholder="08..."
			/>{#if errorFor('phone')}<small class="field-error">{errorFor('phone')}</small>{/if}</label
		>
		<label
			>Email *<input
				class:error-input={errorFor('email')}
				bind:value={form.email}
				type="email"
				placeholder="nama@email.com"
			/>{#if errorFor('email')}<small class="field-error">{errorFor('email')}</small>{/if}</label
		>
		<label
			>Tempat lahir *<input
				bind:value={form.birth_place}
				maxlength="100"
				placeholder="Kota kelahiran"
			/>{#if errorFor('birth_place')}<small class="field-error">{errorFor('birth_place')}</small
				>{/if}</label
		>
		<label
			>Tanggal lahir *<input
				class:error-input={errorFor('birth_date')}
				bind:value={form.birth_date}
				type="date"
				max={maxBirthDate()}
			/>{#if errorFor('birth_date')}<small class="field-error">{errorFor('birth_date')}</small
				>{/if}</label
		>
		<label class="wide"
			>Alamat *<textarea
				class:error-input={errorFor('address')}
				bind:value={form.address}
				rows="2"
				placeholder="Alamat lengkap"></textarea>{#if errorFor('address')}<small class="field-error"
					>{errorFor('address')}</small
				>{/if}</label
		>
	</div>
	<div class="actions">
		<button type="button" class="secondary-button" onclick={onCancel}>Batal</button><button
			class="primary-button"
			disabled={saving}
			>{saving ? 'Menyimpan...' : mode === 'edit' ? 'Simpan perubahan' : 'Tambah karyawan'}</button
		>
	</div>
</form>

<style>
	.form-panel {
		padding: 0 28px 28px;
	}
	.form-grid {
		display: grid;
		grid-template-columns: 180px 1fr 1fr;
		gap: 16px 14px;
	}
	.form-grid label {
		color: #55627a;
		font-size: 12px;
		font-weight: 700;
	}
	.form-grid label.wide {
		grid-column: 2 / -1;
	}
	.form-grid input,
	.form-grid textarea {
		display: block;
		width: 100%;
		margin-top: 7px;
		padding: 10px 12px;
		border: 1px solid #dce2ec;
		border-radius: 7px;
		color: #27344b;
		background: #fff;
		font: inherit;
	}
	.form-grid textarea {
		resize: vertical;
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
	.photo-box {
		grid-row: span 2;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 175px;
		padding: 14px;
		border: 1px dashed #b8c8df;
		border-radius: 10px;
		color: #55627a;
		text-align: center;
	}
	.photo-preview {
		display: grid;
		place-items: center;
		width: 72px;
		height: 72px;
		margin-bottom: 10px;
		border-radius: 50%;
		color: #1769e0;
		background: #e3efff;
		font-size: 25px;
		font-weight: 800;
	}
	.photo-box small {
		margin: 5px 0 10px;
		color: #9aa5b8;
	}
	.photo-box input {
		width: 100%;
		font-size: 10px;
	}
	.actions {
		display: flex;
		justify-content: end;
		gap: 10px;
		margin-top: 24px;
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
	.primary-button:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}
	:global(body.dark-mode) .form-panel {
		color: #dce4f2;
	}
	:global(body.dark-mode) .form-grid input,
	:global(body.dark-mode) .form-grid textarea {
		color: #dce4f2;
		background: #111b2c;
		border-color: #34445e;
	}
	:global(body.dark-mode) .form-grid label {
		color: #aebbd0;
	}
	@media (max-width: 640px) {
		.form-grid {
			grid-template-columns: 1fr;
		}
		.form-grid label.wide {
			grid-column: auto;
		}
		.photo-box {
			grid-row: auto;
		}
	}
</style>
