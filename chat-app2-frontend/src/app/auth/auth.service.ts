import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

const googleAuthUrl = environment.API_URL + `auth/google`;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private authBaseUrl = 'http://localhost:3000/auth';
  constructor(private http: HttpClient) {}

  login(username: string, password: string) {
    const body = {
      client_id: environment.CLIENT_ID,
      client_secret: environment.CLIENT_SECRET,
      username: username,
      password: password,
    };
    return this.http.post<{ code: string }>(`${this.authBaseUrl}/login`, body);
  }

  oAuthLogin(url: string) {
    const myform = document.createElement('form');
    const body = {
      client_id: environment.CLIENT_ID,
      client_secret: environment.CLIENT_SECRET,
    };
    myform.method = 'POST';
    myform.action = url;
    myform.style.display = 'none';
    myform.append('Content-Type', 'application/x-www-form-urlencoded');
    Object.keys(body).forEach((key) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      input.value = (body as any)[key]; //NOSONAR
      myform.appendChild(input);
    });
    document.body.appendChild(myform);
    myform.submit();
  }

  loginViaGoogle() {
    this.oAuthLogin(googleAuthUrl);
  }

  getAccessToken(code: string) {
    return this.http.post<{
      accessToken: string;
      refreshToken: string;
      expires: number;
    }>(`${this.authBaseUrl}/token`, {
      code: code,
      clientId: environment.CLIENT_ID,
    });
  }

  refreshToken(refreshToken: string) {
    return this.http.post(`${this.authBaseUrl}/token-refresh`, {
      refreshToken,
    });
  }
}
