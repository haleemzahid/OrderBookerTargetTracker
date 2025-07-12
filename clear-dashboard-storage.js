// Simple script to clear dashboard localStorage
// Run this in the browser console to reset the dashboard layout

if (typeof window !== 'undefined' && window.localStorage) {
  localStorage.removeItem('dashboard-store');
  console.log('Dashboard store cleared! Refresh the page to see the new default layout.');
} else {
  console.log('localStorage not available');
}
