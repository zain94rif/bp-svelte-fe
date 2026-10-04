import { PUBLIC_API_BASE_URL } from '$env/static/public';
import type { ApiError, AuthSession } from './types';

export const BACKEND_OPTIONS = [
	{ name: 'Go', url: 'http://localhost:8080' },
	{ name: 'Elysia', url: 'http://localhost:3080' }
] as const;
const BACKEND_STORAGE_KEY = 'bpjs-api-base-url';
const API_BASE_URL =
	BACKEND_OPTIONS.find((backend) => backend.url === PUBLIC_API_BASE_URL)?.url ??
	BACKEND_OPTIONS[0].url;
const ACCESS_TOKEN_KEY = 'bpjs-access-token';
const REFRESH_TOKEN_KEY = 'bpjs-refresh-token';
const USER_KEY = 'bpjs-user';

function isBrowser() {
	return typeof window !== 'undefined';
}

export function getApiBaseUrl() {
	if (!isBrowser()) return API_BASE_URL;
	const selected = localStorage.getItem(BACKEND_STORAGE_KEY);
	return BACKEND_OPTIONS.find((backend) => backend.url === selected)?.url ?? API_BASE_URL;
}

export function setApiBaseUrl(url: string) {
	if (!BACKEND_OPTIONS.some((backend) => backend.url === url))
		throw new Error('Backend yang dipilih tidak dikenal.');
	if (isBrowser()) localStorage.setItem(BACKEND_STORAGE_KEY, url);
}

export function getSession(): AuthSession | null {
	if (!isBrowser()) return null;
	const access_token = localStorage.getItem(ACCESS_TOKEN_KEY);
	const refresh_token = localStorage.getItem(REFRESH_TOKEN_KEY);
	const user = localStorage.getItem(USER_KEY);
	if (!access_token || !refresh_token || !user) return null;
	try {
		return { access_token, refresh_token, user: JSON.parse(user), expires_in: 0 };
	} catch {
		clearSession();
		return null;
	}
}

export function saveSession(session: AuthSession) {
	if (!isBrowser()) return;
	localStorage.setItem(ACCESS_TOKEN_KEY, session.access_token);
	localStorage.setItem(REFRESH_TOKEN_KEY, session.refresh_token);
	localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

export function clearSession() {
	if (!isBrowser()) return;
	localStorage.removeItem(ACCESS_TOKEN_KEY);
	localStorage.removeItem(REFRESH_TOKEN_KEY);
	localStorage.removeItem(USER_KEY);
}

async function parseResponse(response: Response) {
	if (response.status === 204) return null;
	return response.json().catch(() => ({}));
}

async function refreshSession() {
	const current = getSession();
	if (!current) return false;
	const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/refresh`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ refresh_token: current.refresh_token })
	});
	if (!response.ok) {
		clearSession();
		return false;
	}
	const result = await parseResponse(response);
	if (!result?.data) {
		clearSession();
		return false;
	}
	saveSession(result.data);
	return true;
}

export async function apiRequest<T>(
	path: string,
	options: RequestInit = {},
	retry = true
): Promise<T | null> {
	const headers = new Headers(options.headers);
	const session = getSession();
	if (session) headers.set('Authorization', `Bearer ${session.access_token}`);
	if (options.body && !(options.body instanceof FormData))
		headers.set('Content-Type', 'application/json');

	let response: Response;
	try {
		response = await fetch(`${getApiBaseUrl()}${path}`, { ...options, headers });
	} catch {
		const error = new Error(
			'Tidak dapat terhubung ke backend. Periksa server dan CORS.'
		) as ApiError;
		error.code = 'NETWORK_ERROR';
		throw error;
	}

	if (response.status === 401 && retry && path !== '/api/v1/auth/refresh') {
		if (await refreshSession()) return apiRequest<T>(path, options, false);
	}

	const result = await parseResponse(response);
	if (!response.ok) {
		const error = new Error(result?.error?.message ?? 'Terjadi kesalahan pada server') as ApiError;
		error.status = response.status;
		error.code = result?.error?.code;
		throw error;
	}
	return result;
}

export async function apiBlob(path: string, retry = true) {
	const session = getSession();
	const response = await fetch(`${getApiBaseUrl()}${path}`, {
		headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined
	});
	if (response.status === 401 && retry && (await refreshSession())) return apiBlob(path, false);
	if (!response.ok) {
		const result = await parseResponse(response);
		throw new Error(result?.error?.message ?? 'File tidak dapat diakses');
	}
	return response.blob();
}

export async function login(
	email: string,
	password: string,
	captcha_token = '',
	captcha?: { captcha_id?: string; captcha_answer?: string }
) {
	const result = await apiRequest<{ data: AuthSession }>(
		'/api/v1/auth/login',
		{
			method: 'POST',
			body: JSON.stringify({
				email,
				password,
				...(captcha?.captcha_id
					? { captcha_id: captcha.captcha_id, captcha_answer: captcha.captcha_answer ?? '' }
					: { captcha_token })
			})
		},
		false
	);
	if (!result?.data) throw new Error('Response login tidak valid');
	saveSession(result.data);
	return result.data;
}

export async function getCaptcha() {
	return apiRequest<{ data: { captcha_id: string; image: string } }>(
		'/api/v1/auth/captcha',
		{},
		false
	);
}

export async function logout() {
	const session = getSession();
	try {
		if (session) {
			await apiRequest(
				'/api/v1/auth/logout',
				{
					method: 'POST',
					body: JSON.stringify({ refresh_token: session.refresh_token })
				},
				false
			);
		}
	} finally {
		clearSession();
	}
}

export { API_BASE_URL };
