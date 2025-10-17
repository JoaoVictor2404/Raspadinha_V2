import { useEffect, useState } from "react";

const REFERRAL_KEY = "raspadinha_ref";
const EXPIRY_DAYS = 30;

export function useReferralTracking() {
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    // Check URL for ref parameter
    const urlParams = new URLSearchParams(window.location.search);
    const refFromUrl = urlParams.get("ref");

    console.log('[REFERRAL] URL params:', window.location.search);
    console.log('[REFERRAL] Ref from URL:', refFromUrl);

    if (refFromUrl) {
      // Store in localStorage with expiry
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + EXPIRY_DAYS);
      
      const dataToStore = {
        code: refFromUrl,
        expiry: expiryDate.toISOString(),
      };
      
      localStorage.setItem(REFERRAL_KEY, JSON.stringify(dataToStore));
      console.log('[REFERRAL] Stored in localStorage:', dataToStore);
      
      setReferralCode(refFromUrl);
    } else {
      // Check if we have a stored referral code
      const storedData = localStorage.getItem(REFERRAL_KEY);
      console.log('[REFERRAL] Stored data from localStorage:', storedData);
      
      if (storedData) {
        try {
          const { code, expiry } = JSON.parse(storedData);
          
          // Check if expired
          if (new Date(expiry) > new Date()) {
            console.log('[REFERRAL] Using stored code:', code);
            setReferralCode(code);
          } else {
            console.log('[REFERRAL] Stored code expired, removing');
            // Expired, remove from storage
            localStorage.removeItem(REFERRAL_KEY);
          }
        } catch {
          console.log('[REFERRAL] Error parsing stored data, removing');
          localStorage.removeItem(REFERRAL_KEY);
        }
      } else {
        console.log('[REFERRAL] No stored code found');
      }
    }
  }, []);

  const clearReferral = () => {
    localStorage.removeItem(REFERRAL_KEY);
    setReferralCode(null);
  };

  return { referralCode, clearReferral };
}
