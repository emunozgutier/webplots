import React, { useState, useEffect } from 'react';
import './Analytics.css';

// Declare types for window since we are modifying global scope
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

const GA_MEASUREMENT_ID = 'G-XDRYGHGCVL';
const CONSENT_KEY = 'webplots-analytics-consent';
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

const loadGoogleAnalytics = () => {
  if (typeof window.gtag !== 'undefined') return; // Script already initialized and loaded

  // 1. Create and inject the async script tag
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // 2. Initialize dataLayer and gtag function
  window.dataLayer = window.dataLayer || [];
  
  // Google's script uses traditional function to capture arguments object
  window.gtag = function () {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  
  // 3. Configure gtag
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID);
};

export const Analytics: React.FC = () => {
  const [showBanner, setShowBanner] = useState<boolean>(false);

  useEffect(() => {
    const savedConsent = localStorage.getItem(CONSENT_KEY);
    if (!savedConsent) {
      setShowBanner(true);
    } else {
      try {
        const { status, timestamp } = JSON.parse(savedConsent);
        const isExpired = Date.now() - timestamp > ONE_WEEK_MS;

        if (isExpired) {
          setShowBanner(true);
        } else if (status === 'granted') {
          loadGoogleAnalytics();
        }
      } catch (e) {
        // In case of parsing error, clear and show banner
        localStorage.removeItem(CONSENT_KEY);
        setShowBanner(true);
      }
    }

    // Listener for manual triggers via Help > Enable/Disable Analytics
    const handleTrigger = () => {
      setShowBanner(true);
    };

    window.addEventListener('trigger-analytics-consent', handleTrigger);
    return () => {
      window.removeEventListener('trigger-analytics-consent', handleTrigger);
    };
  }, []);

  const handleAccept = () => {
    localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({ status: 'granted', timestamp: Date.now() })
    );
    loadGoogleAnalytics();
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({ status: 'denied', timestamp: Date.now() })
    );
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <>
      <div className="analytics-backdrop" onClick={handleDecline} />
      <div className="analytics-consent-banner d-flex flex-column gap-3" role="dialog" aria-labelledby="analytics-consent-title">
      <button 
        className="analytics-close-btn" 
        onClick={handleDecline} 
        aria-label="Close consent banner"
        title="Decline analytics tracking"
      >
        <i className="bi bi-x-lg"></i>
      </button>

      <div className="d-flex align-items-start gap-3">
        <div className="analytics-icon-wrapper">
          <i className="bi bi-graph-up-arrow"></i>
        </div>
        <div className="d-flex flex-column">
          <h4 id="analytics-consent-title" className="analytics-title m-0">Help Us Improve WebPlots!</h4>
          <span className="analytics-text mt-1">
            We use Google Analytics to study application performance and feature usage. 
            No personal identifiers are stored. Your support keeps WebPlots growing!
          </span>
        </div>
      </div>

      <div className="d-flex justify-content-end gap-2 mt-1">
        <button 
          className="btn btn-analytics-secondary btn-sm" 
          onClick={handleDecline}
        >
          Decline
        </button>
        <button 
          className="btn btn-analytics-primary btn-sm" 
          onClick={handleAccept}
        >
          Allow Analytics
        </button>
      </div>
    </div>
  </>
  );
};

export default Analytics;
