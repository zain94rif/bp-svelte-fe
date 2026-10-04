<script lang="ts">
	import { apiBlob } from '$lib/api';
	import type { EmployeeDocument } from '$lib/types';
	let {
		employeeId,
		document,
		onClose
	}: { employeeId: string; document: EmployeeDocument; onClose: () => void } = $props();
	let url = $state('');
	let loading = $state(true);
	let error = $state('');

	function download() {
		if (!url) return;
		const link = globalThis.document.createElement('a');
		link.href = url;
		link.download = document.file_name;
		link.click();
		link.remove();
	}

	$effect(() => {
		let active = true;
		apiBlob(`/api/v1/employees/${employeeId}/documents/${document.id}/preview`)
			.then((blob) => {
				if (active) {
					url = URL.createObjectURL(blob);
					loading = false;
				}
			})
			.catch((err) => {
				if (active) {
					error = err instanceof Error ? err.message : 'Preview gagal';
					loading = false;
				}
			});
		return () => {
			active = false;
			if (url) URL.revokeObjectURL(url);
		};
	});
</script>

<div
	class="backdrop"
	role="presentation"
	onclick={(event) => event.target === event.currentTarget && onClose()}
>
	<div class="preview-modal" role="dialog" aria-modal="true">
		<div class="head">
			<div>
				<p>DOKUMEN IJAZAH</p>
				<h2>{document.file_name}</h2>
			</div>
			<button onclick={onClose}>×</button>
		</div>
		{#if loading}<div class="state">Memuat preview...</div>{:else if error}<div class="state error">
				{error}
			</div>{:else if document.mime_type === 'application/pdf'}<iframe
				title={document.file_name}
				src={url}
			></iframe>{:else}<img src={url} alt={document.file_name} />{/if}
		<div class="footer">
			<span>{document.mime_type} · {(document.file_size / 1024 / 1024).toFixed(2)} MB</span><button
				onclick={download}>Download</button
			>
		</div>
	</div>
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 30;
		display: grid;
		place-items: center;
		padding: 18px;
		background: #17203399;
	}
	.preview-modal {
		width: min(850px, 100%);
		height: min(750px, 92vh);
		display: flex;
		flex-direction: column;
		padding: 20px;
		border-radius: 13px;
		background: #fff;
	}
	.head,
	.footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}
	.head p {
		margin: 0 0 5px;
		color: #7d8aa3;
		font-size: 10px;
		font-weight: 800;
		letter-spacing: 0.12em;
	}
	.head h2 {
		margin: 0;
		font-size: 18px;
	}
	.head button {
		border: 0;
		background: transparent;
		font-size: 26px;
		cursor: pointer;
	}
	.preview-modal iframe,
	.preview-modal img {
		flex: 1;
		min-height: 0;
		width: 100%;
		margin: 16px 0;
		border: 1px solid #e4e9f1;
		border-radius: 8px;
		object-fit: contain;
	}
	.state {
		display: grid;
		flex: 1;
		place-items: center;
		color: #7d889d;
	}
	.error {
		color: #b33b42;
	}
	.footer {
		color: #8994a7;
		font-size: 11px;
	}
	.footer button {
		border: 0;
		padding: 0;
		background: transparent;
		cursor: pointer;
		color: #1769e0;
		font-weight: 700;
	}
</style>
