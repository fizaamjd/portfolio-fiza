/*
 * "Light" devices take the lighter path: phones, tablets, in-app browsers
 * (LinkedIn, Instagram, Facebook, X...) and anything that reports 4 GB of
 * memory or less. Their browsers give a page far less graphics memory than a
 * desktop, and a page that goes over is reloaded, then killed: it blinks two
 * or three times and crashes. On these devices the hero uses a 2K texture
 * instead of 8K, renders at a lower pixel ratio with smaller shadow maps, and
 * project cards stay on their still images instead of each running a live reel.
 */
let cached: boolean | null = null;

export function isLightDevice(): boolean {
  if (cached !== null) return cached;
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const inApp = /LinkedInApp|FBAN|FBAV|FB_IAB|Instagram|Twitter|Line\/|Snapchat|TikTok|musical_ly|WhatsApp/i.test(ua);
  // iPadOS reports itself as a Mac, so a touch-capable "Macintosh" is an iPad
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  cached = inApp || mobile || (typeof memory === "number" && memory <= 4);
  return cached;
}
