import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const CONSENT_COOKIE = "pp_cookie_consent";
const CONSENT_STORAGE_KEY = "pp_cookie_consent";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function readConsentCookie() {
  if (typeof document === "undefined") return null;
  try {
    return document.cookie
      .split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith(`${CONSENT_COOKIE}=`));
  } catch {
    return null;
  }
}

function writeConsentCookie(value: "accepted" | "essential") {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  try {
    document.cookie = `${CONSENT_COOKIE}=${value}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax${secure}`;
  } catch {
    // Some locked-down browsers block cookie writes. Keep the banner usable.
  }
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
  } catch {
    // Consent choice can still be made for the current page view.
  }
}

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let storedConsent: string | null = null;
    try {
      storedConsent = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    } catch {
      storedConsent = null;
    }
    setIsVisible(!storedConsent && !readConsentCookie());
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-4 sm:px-6">
      <div className="mx-auto max-w-5xl rounded-2xl border border-pulse/20 bg-white/95 p-4 shadow-2xl shadow-navy/20 backdrop-blur sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div className="space-y-1 text-sm text-slate-700">
          <p className="font-display text-base font-semibold text-slate-950">Cookie notice</p>
          <p>
            We use essential cookies for account access, booking, payment, and security. We are not
            using advertising or analytics cookies right now.
          </p>
          <a
            href="/privacy"
            className="font-semibold text-pulse underline-offset-4 hover:underline"
          >
            Read the privacy policy
          </a>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 sm:mt-0 sm:shrink-0">
          <Button
            type="button"
            variant="outline"
            className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
            onClick={() => {
              writeConsentCookie("essential");
              setIsVisible(false);
            }}
          >
            Essential only
          </Button>
          <Button
            type="button"
            className="bg-gradient-to-r from-pulse to-navy text-white shadow-lg shadow-pulse/25 hover:from-pulse/90 hover:to-navy/90"
            onClick={() => {
              writeConsentCookie("accepted");
              setIsVisible(false);
            }}
          >
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}
