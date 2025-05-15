import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
})
export class AuthComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
    private http: HttpClient,
    private router: Router
  ) {}

  code: string;

  ngOnInit(): void {
    if (this.tokenService.getToken()) {
      this.router.navigateByUrl('/chat');
    }
  }

  async onSubmit(form: NgForm) {
    let res = await this.authService
      .login(form.value.username, form.value.password)
      .toPromise();

    this.authService.getAccessToken(res.code).subscribe((res) => {
      this.tokenService.saveToken(res.accessToken);
      this.tokenService.saveRefreshToken(res.refreshToken);
    });
    this.router.navigateByUrl('/chat');
  }

  loginViaGoogle() {
    this.authService.loginViaGoogle();
  }
}
