import React, { useEffect } from 'react';
import './Analytics.css';
import { useAnalyticsStore } from './store/useAnalytics';

// Declare types for window since we are modifying global scope
declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
    [key: string]: any; // Allow ga-disable dynamic keys
  }
}

const GA_MEASUREMENT_ID = 'G-XDRYGHGCVL';
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

const loadGoogleAnalytics = () => {
  // Ensure Google Analytics is not disabled
  window[`ga-disable-${GA_MEASUREMENT_ID}`] = false;

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
    window.dataLayer?.push(arguments);
  };
  
  // 3. Configure gtag
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID);
};

export const Analytics: React.FC = () => {
  const { status, timestamp, setConsent, resetConsent } = useAnalyticsStore();

  useEffect(() => {
    // Check weekly expiration on mount
    if (status && timestamp) {
      const isExpired = Date.now() - timestamp > ONE_WEEK_MS;
      if (isExpired) {
        resetConsent();
      }
    }
  }, [status, timestamp, resetConsent]);

  useEffect(() => {
    // Handle loading/disabling GA script reactively based on store status
    if (status === 'granted') {
      loadGoogleAnalytics();
    } else if (status === 'denied') {
      window[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
    }
  }, [status]);

  const handleAccept = () => {
    setConsent('granted');
  };

  const handleDecline = () => {
    setConsent('denied');
  };

  // Only show the consent banner if the status has not been chosen yet (status === null)
  if (status !== null) return null;

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

