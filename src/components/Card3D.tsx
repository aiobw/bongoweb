import React, { useRef, useState, useCallback } from 'react';

interface Card3DProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  glare?: boolean;
  scale?: number;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  role?: string;
  tabIndex?: number;
}

export default function Card3D({
  children,
  className = '',
  maxTilt = 10,
  glare = true,
  scale = 1.02,
  onClick,
  role,
  tabIndex,
  ...props
}: Card3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`,
      transition: 'transform 0.08s ease-out'
    });

    if (glare) {
      setGlarePos({
        x: (x / rect.width) * 100,
        y: (y / rect.height) * 100,
        opacity: 0.18
      });
    }
  }, [maxTilt, scale, glare]);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
    });
    if (glare) {
      setGlarePos(prev => ({ ...prev, opacity: 0 }));
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      role={role}
      tabIndex={tabIndex}
      style={{
        ...style,
        transformStyle: 'preserve-3d',
        willChange: isHovered ? 'transform' : 'auto'
      }}
      className={`relative select-none ${className}`}
      {...props}
    >
      {/* 3D Child Layer */}
      <div style={{ transformStyle: 'preserve-3d' }} className="w-full h-full">
        {children}
      </div>

      {/* Dynamic Specular 3D Glare Light Reflection */}
      {glare && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden transition-opacity duration-300 z-30"
          style={{ opacity: glarePos.opacity }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle 180px at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 80%)`,
              mixBlendMode: 'overlay'
            }}
          />
        </div>
      )}
    </div>
  );
}
