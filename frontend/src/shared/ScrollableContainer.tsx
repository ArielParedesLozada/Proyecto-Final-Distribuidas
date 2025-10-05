import React from 'react';

interface ScrollableContainerProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const ScrollableContainer: React.FC<ScrollableContainerProps> = ({ 
  children, 
  className = '', 
  style = {} 
}) => {
  return (
    <div 
      className={`scrollable-container ${className}`}
      style={{
        minHeight: '100vh',
        height: 'auto',
        width: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none', // IE/Edge
        boxSizing: 'border-box',
        ...style
      }}
    >
      <style>{`
        .scrollable-container::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
        
        .scrollable-container {
          box-sizing: border-box;
        }
        
        @media (max-width: 768px) {
          .scrollable-container {
            min-height: 100vh;
            height: auto;
          }
        }
        
        @media (max-width: 480px) {
          .scrollable-container {
            min-height: 100vh;
            height: auto;
          }
        }
      `}</style>
      {children}
    </div>
  );
};

export default ScrollableContainer;
