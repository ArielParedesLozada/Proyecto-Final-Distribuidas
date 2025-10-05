import React from "react";

interface ScrollableContainerProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
const ScrollableContainer: React.FC<ScrollableContainerProps> = ({
  children,
  className = "",
  style = {},
}) => {
  const cls = `no-scrollbar overflow-y-auto overflow-x-hidden scroll-smooth ${className}`;

  return (
    <>
      <style>{`
        .no-scrollbar {
          scrollbar-width: none;       
          -ms-overflow-style: none;    
          scroll-behavior: smooth;      
          transition: all 0.3s ease-in-out;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;               
        }
      `}</style>

      <div className={cls} style={style}>
        {children}
      </div>
    </>
  );
};

export default ScrollableContainer;
