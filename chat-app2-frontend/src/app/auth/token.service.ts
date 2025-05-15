import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TokenService {
  tokenChanged: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  constructor() {}

  logOut() {
    window.sessionStorage.removeItem('accessToken');
    window.sessionStorage.removeItem('refreshToken');
  }

  saveToken(token: string) {
    window.sessionStorage.removeItem('accessToken');
    window.sessionStorage.setItem('accessToken', token);
    this.tokenChanged.next(true);
  }
  getToken(): string | null {
    return window.sessionStorage.getItem('accessToken');
  }
  saveRefreshToken(token: string): void {
    window.sessionStorage.removeItem('refreshToken');
    window.sessionStorage.setItem('refreshToken', token);

    this.tokenChanged.next(true);
  }
  getRefreshToken(): string | null {
    return window.sessionStorage.getItem('refreshToken');
  }
}
