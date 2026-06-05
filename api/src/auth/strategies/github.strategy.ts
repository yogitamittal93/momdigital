import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { AuthService } from '../auth.service';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private readonly config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID:     config.getOrThrow<string>('GITHUB_CLIENT_ID'),
      clientSecret: config.getOrThrow<string>('GITHUB_CLIENT_SECRET'),
      callbackURL:  config.getOrThrow<string>('GITHUB_CALLBACK_URL'),
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: Error | null, user?: unknown) => void,
  ) {
    // GitHub may return emails in profile.emails or profile._json.email
    const email =
      profile.emails?.[0]?.value ||
      (profile as unknown as { _json: { email: string } })._json?.email ||
      '';

    const name  = profile.displayName || profile.username || 'User';
    const photo = profile.photos?.[0]?.value ?? null;

    const user = await this.authService.findOrCreateOAuthUser({
      provider:     'github',
      providerId:   profile.id,
      email,
      name,
      profileImage: photo,
      accessToken,
      refreshToken: refreshToken ?? null,
    });

    done(null, user);
  }
}
