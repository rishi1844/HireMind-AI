const faviconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7c3aed" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="18" fill="#020617" />
  <rect x="6" y="6" width="52" height="52" rx="16" fill="url(#bg)" />
  <path d="M18 19h20c6.6 0 12 5.4 12 12s-5.4 12-12 12H30v10h-8V19Zm8 16h12c2.2 0 4-1.8 4-4s-1.8-4-4-4H26v8Z" fill="#fff" />
</svg>
`;

export async function GET() {
  return new Response(faviconSvg.trim(), {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
