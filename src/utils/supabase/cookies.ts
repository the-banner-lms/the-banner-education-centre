type NamedCookie = { name: string }

const authCookiePattern = /^sb-.+-auth-token(?:\.\d+)?$/

export function hasSupabaseAuthCookie(cookies: NamedCookie[]) {
  return cookies.some(cookie => authCookiePattern.test(cookie.name))
}
