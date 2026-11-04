
export interface ActivateAccountRequest {
  token: string;
  password: string;
}

export interface AuthApiResponse {
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginApiResponse {
  message: string;
  data: {
    accessToken: string;
  };
}

export interface AuthenticatedSessionResponse {
  message: string;
  data: {
    userId: string;
    roleName: string;
  };
}

export interface PasswordRecoveryRequest { email: string }
export interface PasswordResetRequest { token: string; password: string }
