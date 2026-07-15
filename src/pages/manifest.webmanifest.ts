/**
 * Web App Manifest — served at /manifest.webmanifest. Generated (not static) so the
 * base path is baked into start_url/scope/icons, which differs between a GitHub Pages
 * project site and a custom domain. Makes the site installable on phones.
 */
import type { APIRoute } from "astro";
import { withBase } from "../lib/url";

export const GET: APIRoute = () => {
  const manifest = {
    name: "Cinnamon Land",
    short_name: "Cinnamon",
    description: "Discover the places most tourists never see.",
    start_url: withBase("/"),
    scope: withBase("/"),
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#fbf7ef",
    theme_color: "#e0492f",
    categories: ["travel", "navigation", "lifestyle"],
    icons: [
      { src: withBase("/pwa-192.png"), sizes: "192x192", type: "image/png", purpose: "any" },
      { src: withBase("/pwa-512.png"), sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: withBase("/pwa-maskable-512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { "Content-Type": "application/manifest+json; charset=utf-8" },
  });
};
