import { useRef, useEffect } from 'react';
import svgPaths from '../imports/svg-8vv1jmhkim';
import { gsap } from 'gsap';

interface PikoLogoProps {
  onTripleTap?: () => void;
}

export default function PikoLogo({ onTripleTap }: PikoLogoProps) {
  const lastTap = useRef(0);
  const tapCount = useRef(0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Add GSAP animations on mount
  useEffect(() => {
    if (logoRef.current && svgRef.current) {
      // Initial entrance animation
      gsap.fromTo(logoRef.current, 
        { 
          scale: 0.8, 
          opacity: 0,
          rotation: -10
        },
        {
          scale: 1,
          opacity: 1,
          rotation: 0,
          duration: 0.8,
          ease: "back.out(1.7)"
        }
      );
      
      // Add subtle floating animation
      gsap.to(logoRef.current, {
        y: -3,
        duration: 2,
        ease: "power2.inOut",
        repeat: -1,
        yoyo: true
      });
    }
  }, []);

  const handleClick = () => {
    const now = Date.now();
    if (now - lastTap.current < 350) {
      tapCount.current += 1;
    } else {
      tapCount.current = 1;
    }
    lastTap.current = now;

    // Add click animation
    if (logoRef.current) {
      gsap.to(logoRef.current, {
        scale: 0.95,
        duration: 0.1,
        ease: "power2.out",
        yoyo: true,
        repeat: 1
      });
    }

    if (tapCount.current >= 3) {
      tapCount.current = 0;
      onTripleTap?.();
      
      // Special animation for triple tap
      if (logoRef.current) {
        gsap.to(logoRef.current, {
          scale: 1.2,
          rotation: 360,
          duration: 0.6,
          ease: "back.out(1.7)",
          yoyo: true,
          repeat: 1
        });
      }
    }
  };

  // Desktop long-press handler (1.5 seconds)
  const handlePointerDown = () => {
    longPressTimer.current = setTimeout(() => {
      onTripleTap?.();
      
      // Long press animation
      if (logoRef.current) {
        gsap.to(logoRef.current, {
          scale: 1.1,
          rotation: 180,
          duration: 0.5,
          ease: "power2.out"
        });
      }
    }, 1500);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handlePointerLeave = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <button
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      className='select-none focus:outline-none focus:ring-2 focus:ring-primary rounded-full transition-transform active:scale-95 hover:scale-105 duration-200'
      aria-label='Piko Patisserie Logo'
    >
      <div ref={logoRef} className='w-10 h-10 sm:w-12 sm:h-12 relative overflow-hidden'>
        <svg
          ref={svgRef}
          className='block size-full'
          fill='none'
          preserveAspectRatio='none'
          viewBox='0 0 128 128'
        >
          <g id='Piko Logo'>
            <path d={svgPaths.p3e90c600} fill='#0C6071' />
            <path
              clipRule='evenodd'
              d={svgPaths.p29fb7080}
              fill='white'
              fillRule='evenodd'
            />
            <path
              clipRule='evenodd'
              d={svgPaths.p369c6600}
              fill='white'
              fillRule='evenodd'
            />
            <path
              clipRule='evenodd'
              d={svgPaths.pfa1e300}
              fill='white'
              fillRule='evenodd'
            />
            <path
              clipRule='evenodd'
              d={svgPaths.p6e0fd80}
              fill='white'
              fillRule='evenodd'
            />
            <path
              clipRule='evenodd'
              d={svgPaths.p299cc9d0}
              fill='white'
              fillRule='evenodd'
            />
            <path
              clipRule='evenodd'
              d={svgPaths.p10436b80}
              fill='white'
              fillRule='evenodd'
            />
            <path
              clipRule='evenodd'
              d={svgPaths.p5c92a80}
              fill='white'
              fillRule='evenodd'
            />
            <path d={svgPaths.p1d29df00} fill='white' />
            <path d={svgPaths.p1b39fe00} fill='white' />
            <path d={svgPaths.p135d2f0} fill='white' />
            <path d={svgPaths.p468fa00} fill='white' />
            <path d={svgPaths.p1af13470} fill='white' />
            <path d={svgPaths.p38aa3880} fill='white' />
            <path d={svgPaths.p8a30580} fill='white' />
            <path d={svgPaths.p39122d80} fill='white' />
            <path d={svgPaths.p3d44af00} fill='white' />
            <path d={svgPaths.p26000900} fill='white' />
            <path d={svgPaths.p268c0f70} fill='white' />
            <path d={svgPaths.p2cf33d80} fill='white' />
            <path d={svgPaths.p207a7a00} fill='white' />
            <path d={svgPaths.p28032c00} fill='white' />
            <path d={svgPaths.p27038480} fill='white' />
            <path d={svgPaths.p3412e680} fill='white' />
            <path d={svgPaths.p293a0a00} fill='white' />
            <path d={svgPaths.p34cb6100} fill='white' />
            <path d={svgPaths.p2d413c80} fill='white' />
            <path d={svgPaths.p237b5e00} fill='white' />
            <path d={svgPaths.p27cc4400} fill='white' />
            <path d={svgPaths.p1b9c0300} fill='white' />
            <path d={svgPaths.p18b77b00} fill='white' />
            <path d={svgPaths.p1466cc00} fill='white' />
            <path d={svgPaths.p3faa8c80} fill='white' />
            <path d={svgPaths.p2a859280} fill='white' />
            <path d={svgPaths.p1aff7700} fill='white' />
          </g>
        </svg>
      </div>
    </button>
  );
}
