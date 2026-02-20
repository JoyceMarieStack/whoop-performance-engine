// ==========================================================================
// Dashboard — Client-side recovery data fetching and rendering
// ==========================================================================

(function () {
  'use strict';

  // DOM elements
  const loadingEl = document.getElementById('loading');
  const metricsEl = document.getElementById('metrics');
  const errorEl = document.getElementById('error');
  const noDataEl = document.getElementById('no-data');
  const retryBtn = document.getElementById('retry-btn');

  const recoveryValueEl = document.getElementById('recovery-value');
  const hrvValueEl = document.getElementById('hrv-value');
  const rhrValueEl = document.getElementById('rhr-value');
  const recoveryCard = document.getElementById('card-recovery');

  /**
   * Show only the specified state element, hide all others.
   */
  function showState(el) {
    loadingEl.style.display = 'none';
    metricsEl.style.display = 'none';
    errorEl.style.display = 'none';
    noDataEl.style.display = 'none';
    el.style.display = el === metricsEl ? 'grid' : 'flex';
  }

  /**
   * Determine recovery score color class based on value.
   * Green: 67–100, Yellow: 34–66, Red: 0–33
   */
  function getRecoveryColorClass(score) {
    if (score >= 67) return 'recovery-green';
    if (score >= 34) return 'recovery-yellow';
    return 'recovery-red';
  }

  /**
   * Render recovery metrics into the dashboard cards.
   */
  function renderMetrics(data) {
    // Recovery Score
    if (data.recoveryScore !== null && data.recoveryScore !== undefined) {
      recoveryValueEl.textContent = Math.round(data.recoveryScore);
      recoveryCard.className = 'metric-card ' + getRecoveryColorClass(data.recoveryScore);
    } else {
      recoveryValueEl.textContent = '—';
      recoveryCard.className = 'metric-card';
    }

    // HRV
    if (data.hrvRmssdMilli !== null && data.hrvRmssdMilli !== undefined) {
      hrvValueEl.textContent = data.hrvRmssdMilli.toFixed(1);
    } else {
      hrvValueEl.textContent = '—';
    }

    // Resting Heart Rate
    if (data.restingHeartRate !== null && data.restingHeartRate !== undefined) {
      rhrValueEl.textContent = Math.round(data.restingHeartRate);
    } else {
      rhrValueEl.textContent = '—';
    }

    showState(metricsEl);
  }

  /**
   * Fetch recovery data from the BFF API and render the dashboard.
   */
  async function fetchRecovery() {
    showState(loadingEl);

    try {
      const response = await fetch('/api/recovery');

      // Auth expired — redirect to landing page
      if (response.status === 401) {
        window.location.href = '/';
        return;
      }

      // Whoop API error — show error with retry
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        showError(
          'Something went wrong',
          errData.message || 'We couldn\'t load your recovery data. Please try again.'
        );
        return;
      }

      const data = await response.json();

      // Handle PENDING_SCORE / UNSCORABLE — show no-data state
      if (data.scoreState !== 'SCORED') {
        // Check if there's any partial data to show
        const hasPartialData =
          data.recoveryScore !== null ||
          data.hrvRmssdMilli !== null ||
          data.restingHeartRate !== null;

        if (hasPartialData) {
          renderMetrics(data);
        } else {
          showState(noDataEl);
        }
        return;
      }

      renderMetrics(data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      showError(
        'Connection Error',
        'Unable to reach the server. Please check your connection and try again.'
      );
    }
  }

  /**
   * Display an error state with a custom title and message.
   */
  function showError(title, message) {
    document.getElementById('error-title').textContent = title;
    document.getElementById('error-text').textContent = message;
    showState(errorEl);
  }

  // Retry button handler
  retryBtn.addEventListener('click', fetchRecovery);

  // Initial fetch on page load
  fetchRecovery();
})();
