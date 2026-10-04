<script lang="ts">
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import BackendSelector from '$lib/components/BackendSelector.svelte';
	import type { Role, User } from '$lib/types';

	let {
		user,
		darkMode,
		activePage = 'employees',
		onToggleTheme,
		onLogout,
		onNavigate,
		children
	}: {
		user: User;
		darkMode: boolean;
		activePage?: 'employees' | 'users';
		onToggleTheme: () => void;
		onLogout: () => void;
		onNavigate: (page: 'employees' | 'users') => void;
		children: import('svelte').Snippet;
	} = $props();

	let sidebarOpen = $state(false);
	const canManageUsers = (role: Role) => role === 'ADMIN';

	function navigate(page: 'employees' | 'users') {
		sidebarOpen = false;
		onNavigate(page);
	}
</script>

<div class="shell">
	<header class="header">
		<button class="menu-button" aria-label="Buka menu" onclick={() => (sidebarOpen = !sidebarOpen)}
			>☰</button
		>
		<div class="brand">
			<div class="brand-mark">B</div>
			<div><strong>BPJS</strong><span>Ketenagakerjaan</span></div>
		</div>
		<div class="header-actions">
			<BackendSelector />
			<ThemeToggle {darkMode} onToggle={onToggleTheme} /><button
				class="user-button"
				onclick={onLogout}>{user.email} · Keluar</button
			>
		</div>
	</header>
	<button
		class:open={sidebarOpen}
		class="sidebar-backdrop"
		aria-label="Tutup menu"
		onclick={() => (sidebarOpen = false)}
	></button>
	<aside class:open={sidebarOpen} class="sidebar" aria-label="Navigasi utama">
		<div class="sidebar-title">MENU UTAMA</div>
		<button class:active={activePage === 'employees'} onclick={() => navigate('employees')}
			>▦ <span>Data karyawan</span></button
		>
		{#if canManageUsers(user.role)}<button
				class:active={activePage === 'users'}
				onclick={() => navigate('users')}>♙ <span>Manajemen user</span></button
			>{/if}
		<div class="sidebar-title secondary">LAINNYA</div>
		<div class="sidebar-hint">Gunakan menu ini untuk mengelola data dan akses aplikasi.</div>
		<div class="sidebar-footer">Role: <strong>{user.role}</strong></div>
	</aside>
	<main class="main-content">{@render children()}</main>
</div>

<style>
	.shell {
		min-height: 100vh;
		background: #f5f7fb;
	}
	.header {
		position: sticky;
		top: 0;
		z-index: 10;
		height: 72px;
		padding: 0 28px;
		display: flex;
		align-items: center;
		gap: 24px;
		background: #fff;
		border-bottom: 1px solid #e8ebf2;
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 11px;
	}
	.brand-mark {
		width: 34px;
		height: 34px;
		display: grid;
		place-items: center;
		border-radius: 10px;
		background: #1769e0;
		color: #fff;
		font-size: 20px;
		font-weight: 800;
	}
	.brand strong {
		display: block;
		color: #111827;
		font-size: 15px;
	}
	.brand span {
		display: block;
		color: #8892a5;
		font-size: 11px;
	}
	.header-actions {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-left: auto;
	}
	.user-button,
	.menu-button {
		border: 0;
		background: transparent;
		color: #536078;
		cursor: pointer;
		font-size: 12px;
	}
	.user-button {
		padding: 8px;
	}
	.menu-button {
		display: none;
		font-size: 20px;
	}
	.sidebar {
		position: fixed;
		top: 72px;
		bottom: 0;
		left: 0;
		z-index: 9;
		width: 230px;
		padding: 28px 14px;
		background: #fff;
		border-right: 1px solid #e8ebf2;
	}
	.sidebar button {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 12px;
		margin: 3px 0;
		padding: 12px 14px;
		border: 0;
		border-radius: 8px;
		color: #718096;
		background: transparent;
		text-align: left;
		cursor: pointer;
		font-size: 13px;
	}
	.sidebar button:hover,
	.sidebar button.active {
		color: #1769e0;
		background: #edf4ff;
		font-weight: 700;
	}
	.sidebar-title {
		padding: 0 14px 10px;
		color: #9aa5b8;
		font-size: 10px;
		font-weight: 800;
		letter-spacing: 0.12em;
	}
	.sidebar-title.secondary {
		margin-top: 28px;
	}
	.sidebar-hint {
		padding: 0 14px;
		color: #9aa5b8;
		font-size: 11px;
		line-height: 1.5;
	}
	.sidebar-footer {
		position: absolute;
		bottom: 24px;
		padding: 0 14px;
		color: #9aa5b8;
		font-size: 11px;
	}
	.sidebar-footer strong {
		color: #536078;
	}
	.main-content {
		min-height: calc(100vh - 72px);
		margin-left: 230px;
	}
	.sidebar-backdrop {
		display: none;
	}
	:global(body.dark-mode) .shell,
	:global(body.dark-mode) .sidebar,
	:global(body.dark-mode) .header {
		background: #182235;
	}
	.sidebar,
	.header {
		border-color: #2b3950;
	}
	:global(body.dark-mode) .brand strong,
	:global(body.dark-mode) .user-button {
		color: #edf3ff;
	}
	:global(body.dark-mode) .brand span {
		color: #9eacc2;
	}
	:global(body.dark-mode) .sidebar button {
		color: #9eacc2;
	}
	:global(body.dark-mode) .sidebar button:hover,
	:global(body.dark-mode) .sidebar button.active {
		color: #9fc5ff;
		background: #263a5a;
	}
	@media (max-width: 760px) {
		.header {
			padding: 0 16px;
		}
		.menu-button {
			display: block;
		}
		.user-button {
			display: none;
		}
		.header-actions {
			gap: 7px;
		}
		:global(.backend-picker span) {
			display: none;
		}
		.sidebar {
			transform: translateX(-100%);
			transition: transform 0.2s ease;
			box-shadow: 12px 0 30px #17203320;
		}
		.sidebar.open {
			transform: translateX(0);
		}
		.sidebar-backdrop.open {
			position: fixed;
			inset: 72px 0 0;
			z-index: 8;
			display: block;
			background: #17203355;
		}
		.main-content {
			margin-left: 0;
		}
	}
</style>
