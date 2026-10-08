export type User = {
  // ULID. app/Models/User.php uses HasUlids, so this has never been a number —
  // nothing read it, which is why the mismatch survived from the starter's first commit.
  id: string;
  name: string;
  email: string;
  photo_url?: string | null;
  email_verified_at: string | null;
  two_factor_enabled?: boolean;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
};

/**
 * Non-nullable on purpose: every page but one sits behind the auth middleware, and
 * typing `user` as nullable would force a guard into every consumer of the shell.
 * The server does share `null` for guests, though, and `usePage<T>()` cannot widen
 * it back (the intersection collapses to `User`). `layouts/default-layout.tsx` is where
 * a guest can meet a page without its own layout, so it annotates `User | null` itself.
 * Anything else a guest can reach that reads `auth.user` must do the same.
 */
export type Auth = {
  user: User;
};

export type TwoFactorSetupData = {
  svg: string;
  url: string;
};

export type TwoFactorSecretKey = {
  secretKey: string;
};

export type Passkey = {
  id: number;
  name: string;
  authenticator: string | null;
  created_at_diff: string | null;
  last_used_at_diff: string | null;
};
