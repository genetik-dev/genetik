'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import styles from './styles.module.css';

type RotatingLogoProps = {
  /** Logo image src (e.g. /img/dna-logo.svg) */
  src?: string;
  /** Size in pixels */
  size?: number;
  /** Continuous auto-rotate (slow spin) */
  autoRotate?: boolean;
  /** Rotate on mouse/touch move over the logo */
  interactive?: boolean;
  /** Optional class name for the wrapper */
  className?: string;
};

export default function RotatingLogo({
  src = '/img/dna-logo.svg',
  size = 120,
  autoRotate = false,
  interactive = true,
  className,
}: RotatingLogoProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [autoAngle, setAutoAngle] = useState(0);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!interactive || !wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / rect.width;
      const dy = (e.clientY - cy) / rect.height;
      setRotate({ x: dy * -25, y: dx * 25 });
    },
    [interactive],
  );

  const handlePointerLeave = useCallback(() => {
    if (interactive) setRotate({ x: 0, y: 0 });
  }, [interactive]);

  useEffect(() => {
    if (!autoRotate) return;
    const id = requestAnimationFrame(function tick() {
      setAutoAngle((a) => (a + 0.3) % 360);
      requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(id);
  }, [autoRotate]);

  const yDeg = rotate.y + (autoRotate ? autoAngle : 0);
  const transform =
    interactive || autoRotate
      ? `perspective(600px) rotateX(${rotate.x}deg) rotateY(${yDeg}deg)`
      : 'perspective(600px)';

  return (
    <div
      ref={wrapperRef}
      className={[styles.wrapper, className].filter(Boolean).join(' ')}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{ '--logo-size': `${size}px` } as React.CSSProperties}
    >
      <div
        className={styles.card}
        style={{ transform }}
      >
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          className={styles.logo}
          draggable={false}
        />
      </div>
    </div>
  );
}
