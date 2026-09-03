export interface IAuthUser {
  id: string;
  name: string;
  role: string;
}

export interface RegisterUserPayload {
  email: string;
  password: string;
  name: string;
  role: string;
  phone?: string;
  address?: string;
}
