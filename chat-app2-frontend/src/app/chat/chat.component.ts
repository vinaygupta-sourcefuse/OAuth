// Copyright (c) 2022 Sourcefuse Technologies
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT
import { Component, OnInit } from '@angular/core';
// import { NgxNotificationService } from 'ngx-notification';
import { environment } from '../../environments/environment';
import { Chat, ChatMessage } from '../chat.model';
import { UserService } from '../chat.service';
import { io, SocketOptions, ManagerOptions } from 'socket.io-client';
import { ActivatedRoute, Router } from '@angular/router';
import { TokenService } from '../auth/token.service';
import { AuthService } from '../auth/auth.service';
import {jwtDecode} from 'jwt-decode';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  // styleUrls: ['./chat.component.css']
  styles: [
    `
      ::ng-deep nb-layout-column {
        display: flex;
        justify-content: center;
      }
      :host {
        display: flex;
      }
      nb-chat {
        width: 300px;
        margin: 1rem;
      }
    `,
  ],
})
export class ChatComponent implements OnInit {
  public token: string;
  public user: any;
  constructor(
    private readonly userHttpService: UserService,
    // private readonly ngxNotificationService: NgxNotificationService,
    private tokenService: TokenService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.route.queryParams.subscribe((params) => {
      this.authService.getAccessToken(params.code).subscribe((res) => {
        this.token = res.accessToken;
        window.sessionStorage.removeItem('accessToken');
        window.sessionStorage.setItem('accessToken', res.accessToken);
        this.channelUUID = environment.CHAT_ROOM;
        this.enterToken();
      });
    });
  }

  ngOnInit(): void {
    this.channelUUID = environment.CHAT_ROOM;
    this.tokenService.tokenChanged.subscribe((res) => {
      if (res) {
        this.token = this.tokenService.getToken() || '';
        this.enterToken();
      }
    });
  }

  public messages: ChatMessage[] = [];
  public senderUUID = '';
  public channelUUID = environment.CHAT_ROOM;
  public inRoom = true;

  socketIOOpts: Partial<ManagerOptions & SocketOptions> = {
    path: '/socket.io',
    transports: ['polling'],
    upgrade: false,
  };

  enterToken() {
    this.userHttpService.getUserTenantId(this.token).subscribe((data) => {
      this.senderUUID = data;
    });
  }

  leaveRoom() {
    this.messages = [];
    this.inRoom = false;
  }

  logOut() {
    window.sessionStorage.removeItem('accessToken');
    window.sessionStorage.removeItem('refreshToken');
    this.router.navigateByUrl('');
  }

  getMessages() {
    if (!this.user) {
      this.user = jwtDecode(this.token);
    }
    this.inRoom = true;
    this.token = window.sessionStorage.getItem('accessToken') || '';
    this.userHttpService.get(this.token, this.channelUUID).subscribe((data) => {
      this.messages = [];
      for (const d of data) {
        console.log(d);

        const temp: ChatMessage = {
          body: d.body,
          subject: d.subject,
          channelType: '0',
          reply: false,
          sender: d.subject,
        };
        if (d.createdBy === this.senderUUID) {
          temp.sender = this.user.firstName;
          temp.reply = true;
        }
        this.messages.push(temp);
      }
    });

    // this.subcribeToNotifications();
  }

  // subcribeToNotifications() {
  //   const socket = io(environment.SOCKET_ENDPOINT, this.socketIOOpts);
  //   socket.on('connect', () => {
  //     const channelsToAdd: string[] = [this.channelUUID];
  //     socket.emit('subscribe-to-channel', channelsToAdd);
  //   });

  //   socket.on('userNotif', (message) => {
  //     const temp: ChatMessage = {
  //       body: message.body,
  //       subject: message.subject,
  //       channelType: '0',
  //       reply: false,
  //       sender: message.subject,
  //     };
  //     if (message.subject != this.user.firstName) {
  //       this.messages.push(temp);
  //       this.ngxNotificationService.sendMessage(
  //         `New message from ${message.subject}: ${message.body}`,
  //         'info',
  //         'top-left'
  //       );
  //     }
  //   });
  // }

  // sonarignore:start
  sendMessage(event: { message: string }, userName: string, avatar: string) {
    // sonarignore:end
    if (!this.inRoom) {
      return;
    }

    this.token = window.sessionStorage.getItem('accessToken') || '';
    const chatMessage: ChatMessage = {
      body: event.message,
      subject: 'new message',
      toUserId: this.channelUUID,
      channelId: this.channelUUID,
      channelType: '0',
      reply: true,
      sender: userName,
    };

    const dbMessage: Chat = {
      body: event.message,
      subject: userName,
      toUserId: this.channelUUID,
      channelId: this.channelUUID,
      channelType: '0',
    };

    // sonarignore:start
    this.userHttpService.post(dbMessage, this.token).subscribe((response) => {
      // sonarignore:end
      this.messages.push(chatMessage);
    });
  }
}
