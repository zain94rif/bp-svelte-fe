export type Role = 'ADMIN' | 'VIEWER';

export type User = {
	id: string;
	email: string;
	role: Role;
	active?: boolean;
	created_at?: string;
	updated_at?: string;
};

export type AuthSession = {
	access_token: string;
	refresh_token: string;
	expires_in: number;
	user: User;
};

export type CaptchaChallenge = {
	captcha_id: string;
	image: string;
};

export type Employee = {
	id: string;
	nik: string;
	kpj: string;
	full_name: string;
	phone: string;
	email: string;
	birth_place: string;
	birth_date: string;
	address: string;
	photo_url?: string | null;
	created_at?: string;
	updated_at?: string;
};

export type EmployeeForm = Omit<Employee, 'id' | 'photo_url' | 'created_at' | 'updated_at'>;

export type EmployeeDocument = {
	id: string;
	employee_id: string;
	type: 'diploma';
	file_name: string;
	mime_type: string;
	file_size: number;
	preview_url?: string;
	download_url?: string;
};

export type ListResponse<T> = {
	data: T;
	meta: { page: number; limit: number; total: number };
};

export type ApiError = Error & { status?: number; code?: string };
