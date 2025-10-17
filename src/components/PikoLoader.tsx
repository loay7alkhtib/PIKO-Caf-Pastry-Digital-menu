import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Progress } from './ui/progress';
import { useLang } from '../lib/LangContext';
import { dirFor, t } from '../lib/i18n';
import svgPaths from '../imports/svg-8vv1jmhkim';

export default function PikoLoader() {
  const [progress, setProgress] = useState(0);
  const { lang } = useLang();

  useEffect(() => {
    // Simulate loading progress with a more realistic curve
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        // Fast at first, then slower
        const increment = prev < 50 ? 15 : prev < 80 ? 8 : 3;
        return Math.min(prev + increment, 100);
      });
    }, 200);

    return () => clearInterval(timer);
  }, []);

  const getLoadingMessage = () => {
    if (progress < 30) return t('loadingMenu', lang);
    if (progress < 60) return t('fetchingCategories', lang);
    if (progress < 90) return t('loadingItems', lang);
    return t('almostReady', lang);
  };

  return (
    <div
      className='min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-6 overflow-hidden relative'
      dir={dirFor(lang)}
    >
      {/* Animated background elements */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        {/* Floating croissants */}
        <motion.div
          className='absolute text-6xl opacity-10'
          initial={{ x: -100, y: 100, rotate: 0 }}
          animate={{
            x: ['0%', '100%'],
            y: ['0%', '-20%', '0%'],
            rotate: [0, 360],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          style={{ left: '10%', top: '20%' }}
        >
          🥐
        </motion.div>
        <motion.div
          className='absolute text-5xl opacity-10'
          initial={{ x: 100, y: -100, rotate: 0 }}
          animate={{
            x: ['-100%', '0%'],
            y: ['100%', '20%', '100%'],
            rotate: [360, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'linear',
            delay: 2,
          }}
          style={{ right: '15%', top: '60%' }}
        >
          ☕
        </motion.div>
        <motion.div
          className='absolute text-4xl opacity-10'
          initial={{ x: 0, y: 0, rotate: 0 }}
          animate={{
            x: ['100%', '-100%'],
            y: ['50%', '0%', '50%'],
            rotate: [0, -360],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: 'linear',
            delay: 4,
          }}
          style={{ left: '60%', top: '80%' }}
        >
          🧁
        </motion.div>
        <motion.div
          className='absolute text-5xl opacity-10'
          initial={{ x: 0, y: 0, rotate: 0 }}
          animate={{
            x: ['-50%', '150%'],
            y: ['80%', '20%', '80%'],
            rotate: [0, 180],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: 'linear',
            delay: 1,
          }}
          style={{ left: '30%', top: '10%' }}
        >
          🍰
        </motion.div>
      </div>

      {/* Main content */}
      <div className='relative z-10 flex flex-col items-center gap-8 w-full max-w-md'>
        {/* Animated Piko Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{
            scale: 1,
            rotate: 0,
          }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 20,
            duration: 0.8,
          }}
          className='relative'
        >
          {/* Glow effect */}
          <motion.div
            className='absolute -inset-4 bg-primary/20 rounded-full blur-2xl'
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Logo */}
          <motion.div
            className='relative w-24 h-24 sm:w-32 sm:h-32'
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
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
          </motion.div>
        </motion.div>

        {/* Loading text with typing animation */}
        <motion.div
          className='text-center space-y-2'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className='text-2xl sm:text-3xl font-medium bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent'>
            {t('brandName', lang)}
          </h2>
          <motion.p
            className='text-sm text-muted-foreground'
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {t('preparingMenu', lang)}
          </motion.p>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          className='w-full space-y-3'
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
        >
          <Progress value={progress} className='h-2' />

          <div className='flex items-center justify-between text-xs text-muted-foreground px-1'>
            <motion.span
              key={progress}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {progress}%
            </motion.span>
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {getLoadingMessage()}
            </motion.span>
          </div>
        </motion.div>

        {/* Fun loading indicators */}
        <motion.div
          className='flex gap-2'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className='w-2 h-2 rounded-full bg-primary'
              animate={{
                y: [0, -12, 0],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
