import { forwardRef } from 'react';
import type React from 'react';
import './extended-art.css';

type Props = {
  /** Main artwork. */
  src: string;
  /** Strips continuing the art's top / bottom edge (scripts/artlib.edge_strip). */
  extTop: string;
  extBottom: string;
  canvas: { width: number; height: number };
  /** Fade the art's top edge into the top strip (for art cut at the top). */
  featherTop?: boolean;
  className?: string;
  /** Overlays positioned in canvas percentages; --u = one source pixel. */
  children?: React.ReactNode;
};

/**
 * Full-screen artwork for portrait phones: the art fills the width (never
 * cropped), and the extra height is filled with strips that continue the
 * art's own top/bottom edges.
 */
export const ExtendedArt = forwardRef<HTMLDivElement, Props>(function ExtendedArt(
  { src, extTop, extBottom, canvas, featherTop, className, children },
  stageRef,
) {
  return (
    <div
      className={`xart${featherTop ? ' xart--feather' : ''}${className ? ` ${className}` : ''}`}
      style={{ '--art-w': canvas.width, '--art-h': canvas.height } as React.CSSProperties}
    >
      <div className="xart__ext" aria-hidden="true" style={{ backgroundImage: `url(${extTop})` }} />
      <div className="xart__stage" ref={stageRef}>
        <img className="xart__img" src={src} alt="" draggable={false} />
        {children}
      </div>
      <div className="xart__ext" aria-hidden="true" style={{ backgroundImage: `url(${extBottom})` }} />
    </div>
  );
});
