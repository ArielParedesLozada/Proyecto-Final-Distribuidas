import React from 'react';

const ScrollableContainer = ({ children, className = '', style = {} }) => {
  return (
    <div 
      className={className}
      style={{
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none', // IE/Edge
        ...style
      }}
      css={{
        '&::-webkit-scrollbar': {
          display: 'none' // Chrome, Safari, Opera
        }
      }}
    >
      {children}
    </div>
  );
};

export default ScrollableContainer;
