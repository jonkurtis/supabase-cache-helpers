import { NavItem } from "@/types/nav"

interface SiteConfig {
  name: string
  description: string
  mainNav: NavItem[]
  links: {
    twitter: string
    github: string
    docs: string
  }
}

export const siteConfig: SiteConfig = {
  name: "Supabase Cache Helpers for SWR",
  description: "A collection of SWR utilities for working with Supabase.",
  mainNav: [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "useInfiniteScrollQuery",
      href: "/use-infinite-scroll-query",
    },
    {
      title: "usePaginationQuery",
      href: "/use-pagination-query",
    },
  ],
  links: {
    twitter: "https://twitter.com/psteinroe",
    github: "https://github.com/psteinroe/supabase-cache-helpers",
    docs: "supabase-cache-helpers.vercel.app",
  },
}
