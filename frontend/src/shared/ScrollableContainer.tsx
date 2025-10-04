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
  const cls = `no-scrollbar overflow-y-auto overflow-x-hidden ${className}`;

  return (
    <>
      {/* Estilos scoped para ocultar scrollbar solo en .no-scrollbar */}
      <style>{`
        .no-scrollbar {
          scrollbar-width: none;        /* Firefox */
          -ms-overflow-style: none;     /* IE/Edge */
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;                /* Chrome, Safari, Opera */
        }
      `}</style>

      <div className={cls} style={style}>
        {children}
      </div>
    </>
  );
};

export default ScrollableContainer;
