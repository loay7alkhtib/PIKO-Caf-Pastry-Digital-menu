import { useEffect, useRef, useState } from 'react';
import { Progress } from './ui/progress';
import { useLang } from '../lib/LangContext';
import { t } from '../lib/i18n';
import svgPaths from '../imports/svg-8vv1jmhkim';
import { gsap } from 'gsap';

export default function PikoLoader() {
  const [progress, setProgress] = useState(0);
  const { lang } = useLang();

  // Refs for GSAP animations
  const logoRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const confettiRef = useRef<HTMLDivElement>(null);

  // Create confetti particles
  const createConfetti = () => {
    if (!confettiRef.current) return;
    
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    const shapes = ['🎉', '✨', '🌟', '💫', '🎊', '⭐', '💎'];
    
    // Create 50 confetti particles
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.style.position = 'absolute';
      confetti.style.fontSize = `${Math.random() * 20 + 10}px`;
      confetti.style.color = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.pointerEvents = 'none';
      confetti.style.zIndex = '1000';
      confetti.textContent = shapes[Math.floor(Math.random() * shapes.length)];
      
      // Random starting position
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.top = `${Math.random() * 100}%`;
      
      confettiRef.current.appendChild(confetti);
      
      // Animate each confetti particle
      gsap.fromTo(confetti, 
        {
          x: 0,
          y: 0,
          rotation: 0,
          scale: 0,
          opacity: 1,
        },
        {
          x: (Math.random() - 0.5) * 1000,
          y: (Math.random() - 0.5) * 1000,
          rotation: Math.random() * 720,
          scale: Math.random() * 1.5 + 0.5,
          opacity: 0,
          duration: Math.random() * 2 + 2,
          ease: 'power2.out',
          onComplete: () => {
            if (confetti.parentNode) {
              confetti.parentNode.removeChild(confetti);
            }
          },
        }
      );
    }
  };

  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      // GSAP animations on mount
      const tl = gsap.timeline();

      // Initial setup - hide all elements
      gsap.set(
        [
          logoRef.current,
          progressRef.current,
          textRef.current,
          dotsRef.current,
        ],
        {
          opacity: 0,
          y: 50,
        },
      );

      // Animate background elements with complex floating animations
      if (backgroundRef.current) {
        const children = backgroundRef.current.children;

        // Initial entrance animation
        gsap.fromTo(
          children,
          {
            scale: 0,
            rotation: -180,
            opacity: 0,
          },
          {
            scale: 1,
            rotation: 0,
            opacity: 0.1,
            duration: 1.5,
            stagger: 0.3,
            ease: 'back.out(1.7)',
          },
        );

        // Create floating animations for each element
        Array.from(children).forEach((child: Element, index: number) => {
          const duration = 15 + index * 3; // Varying durations
          const delay = index * 0.5;

          gsap.to(child, {
            x: `+=${100 + index * 50}`,
            y: `+=${-50 + index * 30}`,
            rotation: `+=${360 + index * 180}`,
            duration,
            ease: 'none',
            repeat: -1,
            yoyo: true,
            delay,
          });

          // Add pulsing scale effect
          gsap.to(child, {
            scale: 1.2,
            opacity: 0.2,
            duration: 2 + index * 0.5,
            ease: 'power2.inOut',
            repeat: -1,
            yoyo: true,
            delay: delay + 1,
          });
        });
      }

      // Logo entrance animation
      tl.to(logoRef.current, {
        opacity: 1,
        y: 0,
        scale: 1,
        rotation: 0,
        duration: 1.2,
        ease: 'elastic.out(1, 0.3)',
      })
        // Add pulsing glow effect to logo
        .to(
          logoRef.current?.querySelector('.glow-effect') || [],
          {
            scale: 1.3,
            opacity: 0.8,
            duration: 2,
            repeat: -1,
            yoyo: true,
            ease: 'power2.inOut',
          },
          '-=0.5',
        )
        // Text animation
        .to(
          textRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
          },
          '-=0.3',
        )
        // Progress bar animation
        .to(
          progressRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: 'power2.out',
          },
          '-=0.2',
        )
        // Dots animation
        .to(
          dotsRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            ease: 'power2.out',
          },
          '-=0.1',
        );

      // Animate the loading dots
      if (dotsRef.current && dotsRef.current.children.length > 0) {
        gsap.to(dotsRef.current.children, {
          y: -12,
          opacity: 1,
          duration: 0.8,
          stagger: 0.2,
          repeat: -1,
          yoyo: true,
          ease: 'power2.inOut',
        });
      }

      // Simulate loading progress with a more realistic curve
      const progressTimer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) return 100;
          // Fast at first, then slower
          const increment = prev < 50 ? 15 : prev < 80 ? 8 : 3;
          return Math.min(prev + increment, 100);
        });
      }, 200);

      return () => {
        clearInterval(progressTimer);
        tl.kill();
      };
    }, 100); // Small delay to ensure DOM is ready

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Animate progress updates
  useEffect(() => {
    if (progressRef.current) {
      gsap.to(progressRef.current.querySelector('[role="progressbar"]'), {
        scaleX: progress / 100,
        duration: 0.3,
        ease: 'power2.out',
      });
    }

    // Completion animation when loading reaches 100%
    if (progress === 100) {
      const completionTl = gsap.timeline();

      // Trigger confetti explosion!
      createConfetti();

      // Logo celebration animation with extra bounce
      completionTl
        .to(logoRef.current, {
          scale: 1.3,
          rotation: 360,
          duration: 0.8,
          ease: 'back.out(1.7)',
        })
        .to(logoRef.current, {
          scale: 1.1,
          rotation: 0,
          duration: 0.5,
          ease: 'elastic.out(1, 0.3)',
        })
        .to(logoRef.current, {
          scale: 1,
          duration: 0.3,
          ease: 'power2.out',
        });

      // Progress bar completion effect with celebration
      completionTl
        .to(
          progressRef.current,
          {
            scale: 1.1,
            duration: 0.3,
            ease: 'power2.out',
          },
          '-=0.5',
        )
        .to(progressRef.current, {
          scale: 1,
          duration: 0.2,
          ease: 'power2.out',
        });

      // Add a fun "Ready!" message with animation
      if (textRef.current) {
        const readyMessage = document.createElement('div');
        readyMessage.textContent = '🎉 Ready! 🎉';
        readyMessage.style.position = 'absolute';
        readyMessage.style.top = '50%';
        readyMessage.style.left = '50%';
        readyMessage.style.transform = 'translate(-50%, -50%)';
        readyMessage.style.fontSize = '2rem';
        readyMessage.style.fontWeight = 'bold';
        readyMessage.style.color = '#FF6B6B';
        readyMessage.style.zIndex = '1001';
        readyMessage.style.pointerEvents = 'none';
        
        textRef.current.appendChild(readyMessage);
        
        gsap.fromTo(readyMessage, 
          { scale: 0, opacity: 0 },
          { 
            scale: 1.2, 
            opacity: 1, 
            duration: 0.5, 
            ease: 'back.out(1.7)',
            yoyo: true,
            repeat: 1,
            onComplete: () => {
              if (readyMessage.parentNode) {
                readyMessage.parentNode.removeChild(readyMessage);
              }
            }
          }
        );
      }
    }
  }, [progress]);

  const getLoadingMessage = () => {
    if (progress < 30) return '🍰 Preparing delicious treats...';
    if (progress < 60) return '☕ Brewing the perfect coffee...';
    if (progress < 90) return '🥐 Fresh pastries coming up...';
    return '✨ Almost ready to serve! ✨';
  };

  return (
    <div className='min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-6 overflow-hidden relative'>
      {/* Confetti container */}
      <div
        ref={confettiRef}
        className='absolute inset-0 overflow-hidden pointer-events-none z-50'
      />
      
      {/* Animated background elements */}
      <div
        ref={backgroundRef}
        className='absolute inset-0 overflow-hidden pointer-events-none'
      >
        {/* Floating food items with GSAP animations */}
        <div
          className='absolute text-6xl opacity-10'
          style={{ left: '10%', top: '20%' }}
        >
          🥐
        </div>
        <div
          className='absolute text-5xl opacity-10'
          style={{ right: '15%', top: '60%' }}
        >
          ☕
        </div>
        <div
          className='absolute text-4xl opacity-10'
          style={{ left: '60%', top: '80%' }}
        >
          🧁
        </div>
        <div
          className='absolute text-5xl opacity-10'
          style={{ left: '30%', top: '10%' }}
        >
          🍰
        </div>
        <div
          className='absolute text-4xl opacity-10'
          style={{ left: '80%', top: '30%' }}
        >
          🍪
        </div>
        <div
          className='absolute text-3xl opacity-10'
          style={{ left: '5%', top: '70%' }}
        >
          🥧
        </div>
        
        {/* Additional sparkle effects */}
        <div className='absolute text-2xl opacity-20 animate-pulse' style={{ left: '20%', top: '40%' }}>
          ✨
        </div>
        <div className='absolute text-xl opacity-15 animate-bounce' style={{ right: '20%', top: '40%' }}>
          💫
        </div>
        <div className='absolute text-lg opacity-25 animate-pulse' style={{ left: '50%', top: '20%' }}>
          🌟
        </div>
        <div className='absolute text-sm opacity-20 animate-bounce' style={{ right: '30%', top: '80%' }}>
          ⭐
        </div>
      </div>

      {/* Main content */}
      <div className='relative z-10 flex flex-col items-center gap-8 w-full max-w-md'>
        {/* Animated Piko Logo */}
        <div ref={logoRef} className='relative'>
          {/* Glow effect */}
          <div className='glow-effect absolute -inset-4 bg-primary/20 rounded-full blur-2xl' />

          {/* Logo */}
          <div className='relative w-24 h-24 sm:w-32 sm:h-32'>
            <svg
              className='block size-full drop-shadow-2xl'
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
        </div>

        {/* Loading text with typing animation */}
        <div ref={textRef} className='text-center space-y-2'>
          <h2 className='text-2xl sm:text-3xl font-medium bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent'>
            {t('brandName', lang)}
          </h2>
          <p className='text-sm text-muted-foreground'>
            {t('preparingMenu', lang)}
          </p>
        </div>

        {/* Progress bar */}
        <div ref={progressRef} className='w-full space-y-3'>
          <div className='relative'>
            <Progress value={progress} className='h-3 bg-gradient-to-r from-primary/20 to-primary/40' />
            {/* Sparkle effect on progress bar */}
            <div className='absolute inset-0 overflow-hidden rounded-full'>
              <div className='absolute top-0 left-0 h-full w-2 bg-gradient-to-r from-transparent via-white to-transparent opacity-60 animate-pulse' 
                   style={{ 
                     left: `${progress}%`, 
                     transform: 'translateX(-50%)',
                     animation: 'shimmer 1.5s ease-in-out infinite'
                   }} />
            </div>
          </div>

          <div className='flex items-center justify-between text-xs text-muted-foreground px-1'>
            <span key={progress} className='font-bold text-primary'>{progress}%</span>
            <span className='text-center flex-1 font-medium'>{getLoadingMessage()}</span>
          </div>
        </div>

        {/* Fun loading indicators */}
        <div ref={dotsRef} className='flex gap-3 items-center'>
          {[0, 1, 2].map(i => (
            <div key={i} className='relative'>
              <div className='w-3 h-3 rounded-full bg-gradient-to-r from-primary to-primary/60 animate-pulse' />
              <div className='absolute inset-0 w-3 h-3 rounded-full bg-primary/30 animate-ping' />
            </div>
          ))}
          <div className='ml-2 text-lg animate-bounce'>✨</div>
        </div>
      </div>
    </div>
  );
}
