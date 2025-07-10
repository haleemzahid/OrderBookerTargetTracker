import React, { useEffect } from 'react';
import { Tour } from 'antd';
import type { TourProps } from 'antd';

interface GuidedTourProps {
  steps: TourProps['steps'];
  open: boolean;
  onClose: () => void;
  tourKey?: string;
}

/**
 * A component that provides a guided tour of the application
 * 
 * @param steps - Array of tour steps with refs to elements
 * @param open - Boolean controlling if the tour is visible
 * @param onClose - Function to call when the tour is closed
 * @param tourKey - Optional key to store in localStorage to prevent showing on subsequent visits
 */
export const GuidedTour: React.FC<GuidedTourProps> = ({ 
  steps, 
  open, 
  onClose, 
  tourKey 
}) => {
  // Check if this tour should be shown based on localStorage
  useEffect(() => {
    if (tourKey) {
      const hasSeenTour = localStorage.getItem(`tour-${tourKey}`);
      if (hasSeenTour) {
        onClose();
      }
    }
  }, [tourKey, onClose]);

  const handleClose = () => {
    // Save to localStorage that the user has seen this tour
    if (tourKey) {
      localStorage.setItem(`tour-${tourKey}`, 'true');
    }
    onClose();
  };

  return (
    <Tour 
      open={open} 
      onClose={handleClose} 
      steps={steps}
      mask={true}
    />
  );
};
