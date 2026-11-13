/**
 * What device is the player on? Read from the browser itself (User-Agent and,
 * where supported, User-Agent Client Hints). No personal data.
 *
 * Limits of what browsers reveal:
 *  - iPhone / iPad: Apple never exposes the model, so it is just "iPhone" / "iPad".
 *  - Android: Chrome-based browsers report the real model (e.g. "Pixel 8",
 *    "SM-S911B" = Galaxy S23) via Client Hints; others may not.
 *  - Desktop: the OS (Windows / macOS / Linux / ChromeOS), not the computer model.
 */
export type DeviceInfo = {
  type: 'mobile' | 'tablet' | 'desktop';
  os: string;
  browser: string;
  model: string;
};

type UAData = {
  mobile?: boolean;
  getHighEntropyValues?: (hints: string[]) => Promise<{ model?: string; platformVersion?: string }>;
};

export async function detectDevice(): Promise<DeviceInfo> {
  const ua = navigator.userAgent;
  const uad = (navigator as Navigator & { userAgentData?: UAData }).userAgentData;
  let hintModel = '';
  let platformVersion = '';
  try {
    const h = await uad?.getHighEntropyValues?.(['model', 'platformVersion']);
    hintModel = (h?.model ?? '').trim();
    platformVersion = h?.platformVersion ?? '';
  } catch {
    /* hints refused: fall back to the UA string */
  }

  // iPadOS 13+ pretends to be a Mac; touch support gives it away
  const iPad = /iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const iPhone = /iPhone|iPod/.test(ua);
  const android = /Android/.test(ua);

  let os = 'Other';
  let model = '';
  if (iPhone || iPad) {
    const v = ua.match(/OS (\d+)[._](\d+)/);
    os = `${iPad ? 'iPadOS' : 'iOS'}${v ? ` ${v[1]}` : ''}`;
    model = iPad ? 'iPad' : 'iPhone';
  } else if (android) {
    const v = ua.match(/Android (\d+)/);
    os = `Android${v ? ` ${v[1]}` : ''}`;
    // UA model is often reduced to "K" by Chrome; prefer Client Hints
    const uaModel = ua.match(/Android [^;)]*;\s*([^;)]+?)(?:\sBuild\/|\)|;)/)?.[1]?.trim();
    model = hintModel || (uaModel && uaModel !== 'K' ? uaModel : '') || 'Android';
  } else if (/CrOS/.test(ua)) {
    os = 'ChromeOS';
    model = 'Chromebook';
  } else if (/Windows/.test(ua)) {
    const major = parseInt(platformVersion, 10);
    os = major >= 13 ? 'Windows 11' : major > 0 ? 'Windows 10' : 'Windows';
    model = 'PC';
  } else if (/Mac OS X|Macintosh/.test(ua)) {
    os = 'macOS';
    model = 'Mac';
  } else if (/Linux/.test(ua)) {
    os = 'Linux';
    model = 'PC';
  }

  const browser = /FBAN|FBAV/.test(ua)
    ? 'Facebook'
    : /Instagram/.test(ua)
      ? 'Instagram'
      : /SamsungBrowser/.test(ua)
        ? 'Samsung Internet'
        : /EdgA?\/|EdgiOS/.test(ua)
          ? 'Edge'
          : /OPR\/|OPiOS/.test(ua)
            ? 'Opera'
            : /FxiOS|Firefox\//.test(ua)
              ? 'Firefox'
              : /CriOS|Chrome\//.test(ua)
                ? 'Chrome'
                : /Safari\//.test(ua)
                  ? 'Safari'
                  : 'Other';

  const type: DeviceInfo['type'] =
    iPad || (android && !/Mobile/.test(ua))
      ? 'tablet'
      : iPhone || android || uad?.mobile
        ? 'mobile'
        : 'desktop';

  return { type, os, browser, model };
}
