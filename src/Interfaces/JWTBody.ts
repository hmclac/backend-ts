export type JWTBody = { // @TODO: Refactor
	access_token: string;
	refresh_token: string;
	user_id: string;
	iat: number;
	exp: number;
}