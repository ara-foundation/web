export const PATHS = {
  home: "/",
  about: "/about",
  resume: "/resume",
  posts: "/posts",
  finds: "/finds",
  error404: "/404",
} as const;

export const CONFIG = {
  site_title: "Ara Web",
  site_url: "https://web.ara.foundation",
  author: "Ara Foundation",
  email: "info@ara.foundation",
  description: "Create shareable app to create global inter-connected apps managed by world!",
} as const;

export const AUTH = {
  GOOGLE_CLIENT_ID: import.meta.env.PUBLIC_GOOGLE_CLIENT_ID!
}
