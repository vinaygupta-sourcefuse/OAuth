// Copyright (c) 2022 Sourcefuse Technologies
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT
import {Provider} from '@loopback/context';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {
  AuthClientRepository,
  GoogleSignUpFn,
  RoleRepository,
  TenantRepository,
  User,
  UserRelations,
  UserRepository,
} from '@sourceloop/authentication-service';

export class GoogleOauth2SignupProvider implements Provider<GoogleSignUpFn> {
  constructor(
    @repository(RoleRepository)
    private readonly roleRepo: RoleRepository,
    @repository(TenantRepository)
    private readonly tenantRepo: TenantRepository,
    @repository(AuthClientRepository)
    private readonly authClientRepo: AuthClientRepository,
    @repository(UserRepository)
    private readonly userRepo: UserRepository,
  ) {}

  value(): GoogleSignUpFn {
    console.log('inside googlesignup provider');
    return async profile => {
      const [tenant, role, client] = await Promise.all([
        this.tenantRepo.findOne({
          where: {
            key: 'master', // fill these value into db hardcoded
          },
        }),
        this.roleRepo.findOne({
          where: {
            roleType: 0,  // fill these value into db hardcoded
          },
        }),
        this.authClientRepo.findOne({
          where: {
            clientId: process.env.GOOGLE_AUTH_CLIENT_ID,  // fill these value into db hardcoded
          },
        }),
      ]);

      // check if user exist
      console.log(tenant, role);

      const userExists = await this.userRepo.findOne({
        where: {
          or: [{username: profile._json.email}, {email: profile._json.email}],
        },
      });
      if (userExists) {
        throw new HttpErrors.BadRequest('User already exists');
      }

      const user = await this.userRepo.createWithoutPassword({
        firstName: profile.name?.givenName ?? '',
        lastName: profile.name?.familyName ?? '',
        username: profile._json.email,
        email: profile._json.email,
        defaultTenantId: tenant?.id,
        authClientIds: `{${client?.id}}`,
      });

      await this.userRepo.credentials(user.id).create({
        userId: user.id,
        authProvider: 'google',
        authId: profile.id,
      });

      await this.userRepo.userTenants(user.id).create({
        userId: user.id,
        tenantId: tenant?.id,
        roleId: role?.id,
      });
      return user as User & UserRelations; // NOSONAR
    };
  }
}
