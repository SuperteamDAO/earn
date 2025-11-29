import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { AnimatedDots } from '@/components/shared/AnimatedDots';
import { Button } from '@/components/ui/button';

import { ProBadge } from '@/features/pro/components/ProBadge';

interface ProSlideoutProps {
  show: boolean;
  proSwitchRef: HTMLDivElement | null;
  slideoutRef: React.MutableRefObject<HTMLDivElement | null>;
  onClose: () => void;
}

export function ProSlideout({
  show,
  proSwitchRef,
  slideoutRef,
  onClose,
}: ProSlideoutProps) {
  const [mounted, setMounted] = useState(false);
  const [arrowPath, setArrowPath] = useState<string | null>(null);
  const [arrowHead, setArrowHead] = useState<{
    x: number;
    y: number;
    angle: number;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const calculateArrow = () => {
    if (!slideoutRef.current || !proSwitchRef) return;

    const slideoutRect = slideoutRef.current.getBoundingClientRect();
    const switchRect = proSwitchRef.getBoundingClientRect();

    // Original start point: left edge of slideout, vertically centered
    const originalStartX = slideoutRect.left;
    const originalStartY = slideoutRect.top + slideoutRect.height / 2;

    // Original end point: right edge of switch, vertically centered
    const originalEndX = switchRect.right;
    const originalEndY = switchRect.top + switchRect.height / 2;

    // Calculate direction vector
    const dx = originalEndX - originalStartX;
    const dy = originalEndY - originalStartY;
    const length = Math.sqrt(dx * dx + dy * dy);
    const unitX = dx / length;
    const unitY = dy / length;

    // Offset both ends by 40px so arrow doesn't connect end-to-end
    const startX = originalStartX + unitX * 200;
    const startY = originalStartY + unitY * 200;
    const endX = originalEndX - unitX * 20;
    const endY = originalEndY - unitY * 20;

    // Control point for quadratic bezier curve (curved to the left)
    const controlX = startX - (startX - endX) * 0.3; // Curve goes left first
    const controlY = (startY + endY) / 2;

    // Create quadratic bezier path
    const path = `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
    setArrowPath(path);

    // Calculate arrowhead position and angle
    // For quadratic bezier, tangent at end point is from control point to end point
    const endDx = endX - controlX;
    const endDy = endY - controlY;
    const angle = Math.atan2(endDy, endDx);

    setArrowHead({ x: endX, y: endY, angle: (angle * 180) / Math.PI });
  };

  useEffect(() => {
    if (!show || !mounted || !proSwitchRef) {
      setArrowPath(null);
      setArrowHead(null);
      return;
    }

    // Calculate arrow on mount and when dependencies change
    const timeoutId = setTimeout(() => {
      calculateArrow();
    }, 100); // Small delay to ensure DOM is ready

    // Update on resize and scroll
    window.addEventListener('resize', calculateArrow);
    window.addEventListener('scroll', calculateArrow, true);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', calculateArrow);
      window.removeEventListener('scroll', calculateArrow, true);
    };
  }, [show, mounted, proSwitchRef]);

  if (!mounted || !show) return null;

  return createPortal(
    <>
      {/* Curved arrow pointing from slideout to Pro switch */}
      {arrowPath && arrowHead && (
        <svg
          className="pointer-events-none fixed top-0 left-0 z-70 h-full w-full"
          style={{ filter: 'drop-shadow(0 2px 4px rgb(0 0 0 / 0.1))' }}
        >
          <path
            d={arrowPath}
            stroke="#6366f1"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <g
            transform={`translate(${arrowHead.x}, ${arrowHead.y}) rotate(${arrowHead.angle})`}
          >
            <path
              d="M 0 0 L -20 -10 M 0 0 L -20 10"
              stroke="#6366f1"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      )}
      <div
        ref={(node) => {
          slideoutRef.current = node;
        }}
        className="animate-in fade-in-0 slide-in-from-right-full fixed right-4 bottom-4 z-[100] max-w-120 duration-300"
        data-state={show ? 'open' : 'closed'}
        style={{ pointerEvents: 'auto' }}
      >
        <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="relative flex w-30 flex-col items-center justify-center overflow-hidden rounded-r-lg bg-zinc-800 px-4 py-6">
            <div className="flex flex-col items-center gap-2">
              <ProBadge
                containerClassName="bg-zinc-600 px-2 py-1 gap-1"
                iconClassName="size-3 text-zinc-400"
                textClassName="text-xs font-medium text-white"
              />
            </div>
            <AnimatedDots
              dotSize={2}
              colors={['#939393']}
              columns={40}
              rows={6}
              spacing={1.5}
              className="absolute top-0 left-0 z-10 opacity-80"
            />
            <div className="absolute top-20 left-0 size-10 rounded-full bg-white/40 blur-[20px]" />
            <div className="absolute right-2 bottom-20 size-10 rounded-full bg-white/20 blur-[20px]" />
          </div>

          <div className="relative flex-1 px-4 py-4">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-50 h-6 w-6 text-slate-400 hover:text-slate-600"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
            <h3 className="mb-2 text-base font-semibold text-slate-800">
              Reach the top 1% talent
            </h3>
            <p className="text-sm text-slate-500">
              You told us about the quality concerns and we wanted to tell you
              about — Pro Listings. A way to target the top 1% talent on our
              platform.
            </p>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
