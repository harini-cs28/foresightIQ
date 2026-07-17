import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export type RobotState = 'idle' | 'thinking' | 'listening' | 'speaking' | 'celebrating' | 'briefing'

interface FORESRobotProps {
  state?: RobotState
  size?: number
}

// ─── Natural speaking mouth — weighted random phoneme timing ─────────────────
function useSpeakingMouth(active: boolean) {
  const [openness, setOpenness] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!active) {
      if (timerRef.current) clearTimeout(timerRef.current)
      setOpenness(0)
      return
    }
    let alive = true
    const tick = () => {
      if (!alive) return
      const r = Math.random()
      const next =
        r < 0.12 ? 0                              // 12% — closed pause
        : r < 0.30 ? 0.15 + Math.random() * 0.15 // 18% — barely open
        : r < 0.65 ? 0.35 + Math.random() * 0.3  // 35% — mid open
        : 0.70 + Math.random() * 0.25             // 35% — wide
      setOpenness(next)
      const delay = 120 + Math.random() * 200     // 120–320ms per phoneme
      timerRef.current = setTimeout(tick, delay)
    }
    timerRef.current = setTimeout(tick, 60)
    return () => { alive = false; if (timerRef.current) clearTimeout(timerRef.current) }
  }, [active])

  return openness
}

// ─── Periodic look-around (idle + speaking) ──────────────────────────────────
function useLookAround(enabled: boolean) {
  const [lookDx, setLookDx] = useState(0)

  useEffect(() => {
    if (!enabled) { setLookDx(0); return }
    let t: ReturnType<typeof setTimeout>
    const schedule = () => {
      const wait = 10000 + Math.random() * 8000   // 10–18s between glances
      t = setTimeout(() => {
        const dir = Math.random() > 0.5 ? -1 : 1
        setLookDx(dir)
        setTimeout(() => { setLookDx(0); schedule() }, 800 + Math.random() * 400)
      }, wait)
    }
    schedule()
    return () => clearTimeout(t)
  }, [enabled])

  return lookDx
}

// ─── Speaking head nod — slow, subtle ────────────────────────────────────────
function useSpeakNod(active: boolean) {
  const [dy, setDy] = useState(0)
  useEffect(() => {
    if (!active) { setDy(0); return }
    let alive = true
    const tick = () => {
      if (!alive) return
      setDy(prev => prev === 0 ? -2 : 0)
      setTimeout(tick, 380 + Math.random() * 200)
    }
    setTimeout(tick, 300)
    return () => { alive = false }
  }, [active])
  return dy
}

export default function FORESRobot({ state = 'idle', size = 220 }: FORESRobotProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [cursorOffset, setCursorOffset] = useState({ x: 0, y: 0 })
  const [blinkPhase, setBlinkPhase]     = useState(false)
  const blinkTimerRef = useRef<ReturnType<typeof setTimeout>>()

  const isSpeaking    = state === 'speaking' || state === 'briefing'
  const isThinking    = state === 'thinking'
  const isListening   = state === 'listening'
  const isCelebrating = state === 'celebrating'
  const isIdle        = state === 'idle'

  // ── Cursor tracking — smooth spring, ≤6px range ──────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const cx = rect.left + rect.width  / 2
      const cy = rect.top  + rect.height / 2
      const dx = (e.clientX - cx) / window.innerWidth
      const dy = (e.clientY - cy) / window.innerHeight
      setCursorOffset({
        x: Math.max(-6, Math.min(6, dx * 16)),
        y: Math.max(-3, Math.min(3, dy * 10)),
      })
    }
    window.addEventListener('mousemove', handler, { passive: true })
    return () => window.removeEventListener('mousemove', handler)
  }, [])

  // ── Natural blink: schedule each blink independently ─────────────────
  useEffect(() => {
    const scheduleBlink = () => {
      const delay = 3500 + Math.random() * 3000   // 3.5–6.5s between blinks
      blinkTimerRef.current = setTimeout(() => {
        setBlinkPhase(true)
        setTimeout(() => { setBlinkPhase(false); scheduleBlink() }, 140)
      }, delay)
    }
    scheduleBlink()
    return () => clearTimeout(blinkTimerRef.current)
  }, [])

  // ── Behaviour hooks ──────────────────────────────────────────────────
  const mouthOpenness = useSpeakingMouth(isSpeaking)
  const lookDx        = useLookAround(isIdle || isSpeaking)
  const nodDy         = useSpeakNod(isSpeaking)

  // ── Eye position: cursor + look-around ───────────────────────────────
  const eyeX = cursorOffset.x + lookDx * 4
  const eyeY = cursorOffset.y

  // ── State-driven colors ───────────────────────────────────────────────
  const eyeColor =
    isListening   ? '#22C55E' :
    isThinking    ? '#F59E0B' :
    isCelebrating ? '#FBBF24' :
    isSpeaking    ? '#38BDF8' :
    '#06B6D4'

  const coreColor  = isSpeaking ? '#38BDF8' : eyeColor
  const corePulse  = isSpeaking ? [13, 18, 13] : isCelebrating ? [13, 17, 13] : [13, 15, 13]
  const coreDur    = isSpeaking ? 0.6 : isCelebrating ? 0.45 : 2.8
  const statusLED  = isCelebrating ? '#FBBF24' : '#22C55E'

  // ── Arm rotation ────────────────────────────────────────────────────
  const leftArmR  = isCelebrating ? [-28,-55,-28] : isSpeaking ? [-8,6,-8]   : isThinking ? [-6,-20,-6] : [-3,3,-3]
  const rightArmR = isCelebrating ? [28,55,28]    : isSpeaking ? [8,-6,8]    : isThinking ? [6,20,6]    : [3,-3,3]
  const armDur    = isCelebrating ? 0.40 : isSpeaking ? 0.7 : isThinking ? 2.4 : 4.0

  // ── Head: float + speaking nod ───────────────────────────────────────
  const headBaseY  = [0, -2, 0]        // subtle 2px float
  const headRotate = isThinking ? [-3, 3, -3] : [0, 0, 0]
  const headDur    = isThinking ? 1.5 : 4.0

  // ── Mouth geometry ──────────────────────────────────────────────────
  const mRy = mouthOpenness * 6.5
  const mRx = 9  + mouthOpenness * 2.5

  const headColor = '#253C60'
  const bodyColor = '#1E3A5F'
  const dark      = '#0F2040'

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size * 1.4 }}
    >
      {/* ── Ambient glow ── */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width:  size * 0.88,
          height: size * 0.88,
          background: `radial-gradient(circle, ${
            isCelebrating ? 'rgba(251,191,36,0.18)'
          : isListening   ? 'rgba(34,197,94,0.15)'
          : isSpeaking    ? 'rgba(56,189,248,0.15)'
          : 'rgba(59,130,246,0.10)'
          } 0%, transparent 70%)`,
          top: size * 0.22, left: size * 0.06,
        }}
        animate={{ scale: [1, 1.08, 1], opacity: isSpeaking ? [0.6, 1, 0.6] : [0.4, 0.85, 0.4] }}
        transition={{ duration: isCelebrating ? 0.55 : isSpeaking ? 1.4 : 4.0, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ── Celebration sparkles ── */}
      <AnimatePresence>
        {isCelebrating && [0, 1, 2, 3, 4, 5].map(i => (
          <motion.div key={i}
            className="absolute w-1.5 h-1.5 rounded-full pointer-events-none"
            style={{ background: ['#FBBF24','#22C55E','#3B82F6','#EF4444','#06B6D4','#F8FAFC'][i] }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
            animate={{ x: [0, (i % 2 === 0 ? 1 : -1) * (26 + i * 13)], y: [0, -50 - i * 8], opacity: [1, 0], scale: [0, 1.4, 0] }}
            transition={{ duration: 0.8, delay: i * 0.08, repeat: Infinity, repeatDelay: 1.0 }}
          />
        ))}
      </AnimatePresence>

      <svg viewBox="0 0 220 305" width={size} height={size * 1.4} style={{ position: 'relative', zIndex: 1 }}>
        <defs>
          <linearGradient id="rBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor={bodyColor} />
            <stop offset="100%" stopColor={dark} />
          </linearGradient>
          <linearGradient id="rHeadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor={headColor} />
            <stop offset="100%" stopColor="#142034" />
          </linearGradient>
          <linearGradient id="rVisorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor={`${eyeColor}CC`} />
            <stop offset="100%" stopColor="rgba(59,130,246,0.55)" />
          </linearGradient>
          <filter id="rGlow">
            <feGaussianBlur stdDeviation="2" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="rSoftGlow">
            <feGaussianBlur stdDeviation="3.5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="rBrightGlow">
            <feGaussianBlur stdDeviation="3" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* ── Antenna ── */}
        <motion.g
          animate={{ rotate: isThinking ? [-6, 6, -6] : [-2, 2, -2] }}
          transition={{ duration: isThinking ? 1.0 : 3.0, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originX: '110px', originY: '42px' }}
        >
          <line x1="110" y1="42" x2="110" y2="15" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/>
          <motion.circle cx="110" cy="11" r="5" fill={eyeColor} filter="url(#rGlow)"
            animate={{ r: isThinking ? [5, 7.5, 5] : isSpeaking ? [5, 7, 5] : [5, 6.5, 5], opacity: [1, 0.5, 1] }}
            transition={{ duration: isThinking ? 0.5 : isSpeaking ? 1.0 : 2.0, repeat: Infinity, ease: 'easeInOut' }}/>
          <motion.circle cx="110" cy="11" r="10" fill="none" stroke={`${eyeColor}44`} strokeWidth="1"
            animate={{ r: [10, 18, 10], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2.0, repeat: Infinity, ease: 'easeOut' }}/>
        </motion.g>

        {/* ── Head: float + speaking nod ── */}
        <motion.g
          animate={{ y: headBaseY, rotate: headRotate }}
          transition={{ duration: headDur, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originX: '110px', originY: '75px' }}
        >
          {/* Apply speaking nod as separate transform */}
          <motion.g
            animate={{ y: nodDy }}
            transition={{ type: 'spring', stiffness: 60, damping: 12 }}
          >
            {/* Head shell */}
            <rect x="72" y="42" width="76" height="68" rx="16"
              fill="url(#rHeadGrad)" stroke={`${eyeColor}44`} strokeWidth="1.5"/>

            {/* Visor */}
            <rect x="80" y="54" width="60" height="38" rx="10" fill={`${eyeColor}12`}/>
            <rect x="80" y="54" width="60" height="38" rx="10" fill="url(#rVisorGrad)" opacity="0.28"/>
            {/* Scanlines */}
            {[59, 65, 71, 77, 83, 89].map((y, i) => (
              <line key={i} x1="82" y1={y} x2="138" y2={y} stroke="rgba(255,255,255,0.035)" strokeWidth="0.7"/>
            ))}

            {/* Thinking orbit ring */}
            {isThinking && (
              <motion.circle cx="110" cy="72" r="24" fill="none" stroke={`${eyeColor}40`} strokeWidth="1.5"
                strokeDasharray="7 4"
                animate={{ rotate: 360 }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
                style={{ originX: '110px', originY: '72px' }}/>
            )}

            {/* ── Eyes with blink ── */}
            {isSpeaking && (
              <motion.ellipse cx={96 + eyeX} cy={72 + eyeY} rx="12" ry="11" fill="none"
                stroke={`${eyeColor}18`} strokeWidth="0.8"
                animate={{ rx: [12, 14, 12], opacity: [0.35, 0.7, 0.35] }}
                transition={{ duration: 1.0, repeat: Infinity, ease: 'easeInOut' }}/>
            )}

            {/* Blink group — controlled by blinkPhase boolean */}
            <motion.g
              animate={{ scaleY: blinkPhase ? 0.04 : 1 }}
              transition={{ duration: 0.08, ease: 'easeInOut' }}
              style={{ originX: '110px', originY: '72px' }}
            >
              {/* Left eye */}
              <ellipse cx={96 + eyeX} cy={72 + eyeY} rx="9" ry="8" fill={`${eyeColor}1A`}/>
              <motion.ellipse cx={96 + eyeX} cy={72 + eyeY} rx="6" ry="6" fill={eyeColor}
                filter={isSpeaking ? 'url(#rBrightGlow)' : 'url(#rGlow)'}
                animate={isThinking ? { rx: [6, 4.5, 6], ry: [6, 7.5, 6] } : {}}
                transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}/>
              <ellipse cx={96 + eyeX} cy={72 + eyeY} rx="3" ry="3" fill="white" opacity="0.9"/>
              <circle  cx={97.5 + eyeX} cy={70.5 + eyeY} r="1" fill="white" opacity="0.6"/>

              {/* Right eye */}
              <ellipse cx={124 + eyeX} cy={72 + eyeY} rx="9" ry="8" fill={`${eyeColor}1A`}/>
              <motion.ellipse cx={124 + eyeX} cy={72 + eyeY} rx="6" ry="6" fill={eyeColor}
                filter={isSpeaking ? 'url(#rBrightGlow)' : 'url(#rGlow)'}
                animate={isThinking ? { rx: [6, 4.5, 6], ry: [6, 7.5, 6] } : {}}
                transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}/>
              <ellipse cx={124 + eyeX} cy={72 + eyeY} rx="3" ry="3" fill="white" opacity="0.9"/>
              <circle  cx={125.5 + eyeX} cy={70.5 + eyeY} r="1" fill="white" opacity="0.6"/>
            </motion.g>

            {/* Listening ear pulses */}
            {isListening && [0, 1].map(i => (
              <motion.circle key={i} cx={i === 0 ? 76 : 144} cy="72" r="5"
                fill="none" stroke="#22C55E" strokeWidth="1.8"
                animate={{ r: [5, 14, 5], opacity: [0.9, 0, 0.9] }}
                transition={{ duration: 1.3, repeat: Infinity, delay: i * 0.65, ease: 'easeOut' }}/>
            ))}

            {/* ── Mouth ── */}
            {isSpeaking ? (
              <motion.ellipse
                cx="110" cy="88"
                rx={mRx} ry={Math.max(0.5, mRy)}
                fill={mouthOpenness > 0.15 ? `${eyeColor}CC` : 'none'}
                stroke={eyeColor}
                strokeWidth="1.6"
                filter="url(#rGlow)"
                animate={{
                  rx: mRx,
                  ry: Math.max(0.5, mRy),
                }}
                transition={{ type: 'spring', stiffness: 160, damping: 22 }}
              />
            ) : isCelebrating ? (
              <path d="M 93 82 Q 110 98 127 82" stroke="#FBBF24" strokeWidth="2.5" fill="none" strokeLinecap="round" filter="url(#rGlow)"/>
            ) : isThinking ? (
              <motion.path d="M 101 86 Q 110 84 119 86" stroke={eyeColor} strokeWidth="2.2" fill="none" strokeLinecap="round"
                animate={{ d: ['M 101 86 Q 110 84 119 86', 'M 101 85 Q 110 88 119 85', 'M 101 86 Q 110 84 119 86'] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}/>
            ) : isListening ? (
              <motion.path d="M 100 86 Q 110 90 120 86" stroke="#22C55E" strokeWidth="2.2" fill="none" strokeLinecap="round"
                animate={{ d: ['M 100 86 Q 110 90 120 86', 'M 100 85 Q 110 88 120 85', 'M 100 86 Q 110 90 120 86'] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}/>
            ) : (
              /* Idle relaxed smile */
              <path d="M 97 84 Q 110 93 123 84" stroke="#3B82F6" strokeWidth="2.2" fill="none" strokeLinecap="round" filter="url(#rGlow)"/>
            )}

            {/* Head side accent panels */}
            <rect x="72" y="62" width="8" height="16" rx="3" fill={`${eyeColor}30`}/>
            <rect x="140" y="62" width="8" height="16" rx="3" fill={`${eyeColor}30`}/>

            {/* Status LED */}
            <motion.circle cx="110" cy="49" r="3.5" fill={statusLED} filter="url(#rGlow)"
              animate={{ opacity: [1, 0.3, 1], r: isCelebrating ? [3.5, 5, 3.5] : [3.5, 3.5, 3.5] }}
              transition={{ duration: isCelebrating ? 0.4 : 1.5, repeat: Infinity, ease: 'easeInOut' }}/>

            {/* FORES label */}
            <text x="110" y="106" textAnchor="middle"
              fill="rgba(148,163,184,0.65)" fontSize="7"
              fontFamily="Space Grotesk, sans-serif" letterSpacing="2">FORES</text>
          </motion.g>
        </motion.g>

        {/* ── Neck (synced with body float) ── */}
        <motion.g animate={{ y: [0, 3.5, 0] }} transition={{ duration: 4.0, repeat: Infinity, ease: 'easeInOut' }}>
          <rect x="104" y="110" width="12" height="10" rx="3" fill="#1A2F4A" stroke={`${eyeColor}22`} strokeWidth="1"/>
          <rect x="106" y="112" width="8" height="2" rx="1" fill={`${eyeColor}45`}/>
          <rect x="106" y="116" width="8" height="2" rx="1" fill={`${eyeColor}22`}/>
        </motion.g>

        {/* ── Body (breathing: subtle scale + float) ── */}
        <motion.g
          animate={{ y: [0, 3.5, 0] }}
          transition={{ duration: 4.0, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Breathing scale on body */}
          <motion.g
            animate={{ scaleY: [1, 1.012, 1], scaleX: [1, 1.006, 1] }}
            transition={{ duration: 4.0, repeat: Infinity, ease: 'easeInOut' }}
            style={{ originX: '110px', originY: '165px' }}
          >
            <rect x="68" y="120" width="84" height="90" rx="14"
              fill="url(#rBodyGrad)" stroke={`${eyeColor}30`} strokeWidth="1.5"/>
            <rect x="80" y="130" width="60" height="50" rx="8"
              fill="rgba(15,23,42,0.85)" stroke={`${eyeColor}14`} strokeWidth="1"/>

            {/* Power core */}
            <motion.circle cx="110" cy="150" r="13" fill={`${coreColor}10`} stroke={`${coreColor}40`} strokeWidth="1.5"
              animate={{ r: corePulse, opacity: isSpeaking ? [0.75, 1, 0.75] : [0.55, 0.9, 0.55] }}
              transition={{ duration: coreDur, repeat: Infinity, ease: 'easeInOut' }}/>
            <motion.circle cx="110" cy="150" r="7.5" fill={`${coreColor}50`} filter="url(#rSoftGlow)"
              animate={{ opacity: isSpeaking ? [0.65, 1, 0.65] : [0.5, 0.9, 0.5], r: isCelebrating ? [7.5, 10, 7.5] : [7.5, 8, 7.5] }}
              transition={{ duration: isSpeaking ? 0.6 : 2.2, repeat: Infinity, ease: 'easeInOut' }}/>
            <circle cx="110" cy="150" r="3.5" fill={coreColor} filter="url(#rGlow)"/>

            {/* Status bars */}
            <rect x="86" y="168" width="48" height="4.5" rx="2.25" fill="rgba(255,255,255,0.04)"/>
            <motion.rect x="86" y="168" rx="2.25" height="4.5" fill="#22C55E"
              animate={{ width: isCelebrating ? [48, 48] : [34, 43, 34] }}
              transition={{ duration: 3.0, repeat: Infinity, ease: 'easeInOut' }}/>
            <rect x="86" y="176" width="48" height="4.5" rx="2.25" fill="rgba(255,255,255,0.04)"/>
            <motion.rect x="86" y="176" rx="2.25" height="4.5" fill="#3B82F6"
              animate={{ width: [24, 38, 24] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}/>

            {/* Side vents */}
            {[132, 140, 148].map((y, i) => (
              <rect key={i} x="70" y={y} width="9" height="2.5" rx="1.25"
                fill={`${eyeColor}${i === 0 ? '40' : '20'}`}/>
            ))}
            {[132, 140, 148].map((y, i) => (
              <rect key={i} x="141" y={y} width="9" height="2.5" rx="1.25"
                fill={`${eyeColor}${i === 0 ? '40' : '20'}`}/>
            ))}

            {/* Belt */}
            <rect x="68" y="200" width="84" height="10" rx="3" fill={`${eyeColor}10`} stroke={`${eyeColor}14`} strokeWidth="1"/>
            <rect x="103" y="201" width="14" height="8" rx="2" fill={`${eyeColor}22`}/>
          </motion.g>
        </motion.g>

        {/* ── Left Arm ── */}
        <motion.g
          animate={{ rotate: leftArmR }}
          transition={{ duration: armDur, repeat: Infinity, ease: 'easeInOut' }}
          style={{ originX: '68px', originY: '130px' }}
        >
          <rect x="44" y="122" width="24" height="14" rx="7" fill="url(#rBodyGrad)" stroke={`${eyeColor}28`} strokeWidth="1.2"/>
          <rect x="40" y="136" width="18" height="50" rx="8" fill="url(#rBodyGrad)" stroke={`${eyeColor}22`} strokeWidth="1.2"/>
          <rect x="38" y="185" width="22" height="16" rx="8" fill="url(#rHeadGrad)" stroke={`${eyeColor}30`} strokeWidth="1.2"/>
          <rect x="42" y="198" width="5" height="7" rx="2.5" fill={`${eyeColor}22`}/>
          <rect x="49" y="198" width="5" height="7" rx="2.5" fill={`${eyeColor}22`}/>
          <rect x="56" y="198" width="5" height="7" rx="2.5" fill={`${eyeColor}22`}/>
        </motion.g>

        {/* ── Right Arm ── */}
        <motion.g
          animate={{ rotate: rightArmR }}
          transition={{ duration: armDur, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          style={{ originX: '152px', originY: '130px' }}
        >
          <rect x="152" y="122" width="24" height="14" rx="7" fill="url(#rBodyGrad)" stroke={`${eyeColor}28`} strokeWidth="1.2"/>
          <rect x="162" y="136" width="18" height="50" rx="8" fill="url(#rBodyGrad)" stroke={`${eyeColor}22`} strokeWidth="1.2"/>
          <rect x="160" y="185" width="22" height="16" rx="8" fill="url(#rHeadGrad)" stroke={`${eyeColor}30`} strokeWidth="1.2"/>
          <rect x="163" y="198" width="5" height="7" rx="2.5" fill={`${eyeColor}22`}/>
          <rect x="170" y="198" width="5" height="7" rx="2.5" fill={`${eyeColor}22`}/>
          <rect x="177" y="198" width="5" height="7" rx="2.5" fill={`${eyeColor}22`}/>
        </motion.g>

        {/* ── Legs ── */}
        <motion.g animate={{ y: [0, 3.5, 0] }} transition={{ duration: 4.0, repeat: Infinity, ease: 'easeInOut' }}>
          {/* Left leg */}
          <rect x="78" y="210" width="26" height="46" rx="8" fill="url(#rBodyGrad)" stroke={`${eyeColor}22`} strokeWidth="1.2"/>
          <rect x="75" y="250" width="32" height="16" rx="7" fill="url(#rHeadGrad)" stroke={`${eyeColor}28`} strokeWidth="1.2"/>
          <motion.circle cx="91" cy="258" r="3.5" fill={`${eyeColor}30`}
            animate={{ opacity: [0.3, 0.9, 0.3] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}/>
          {/* Right leg */}
          <rect x="116" y="210" width="26" height="46" rx="8" fill="url(#rBodyGrad)" stroke={`${eyeColor}22`} strokeWidth="1.2"/>
          <rect x="113" y="250" width="32" height="16" rx="7" fill="url(#rHeadGrad)" stroke={`${eyeColor}28`} strokeWidth="1.2"/>
          <motion.circle cx="129" cy="258" r="3.5" fill={`${eyeColor}30`}
            animate={{ opacity: [0.9, 0.3, 0.9] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}/>
        </motion.g>
      </svg>

      {/* ── State badge ── */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold tracking-widest"
        style={{
          background: `linear-gradient(135deg,${eyeColor}18,${eyeColor}0C)`,
          border: `1px solid ${eyeColor}40`,
          color: eyeColor,
          fontFamily: 'Space Grotesk',
          whiteSpace: 'nowrap',
        }}
        animate={{ boxShadow: [`0 0 6px ${eyeColor}22`, `0 0 18px ${eyeColor}55`, `0 0 6px ${eyeColor}22`] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        FORES ·{' '}
        {state === 'idle'        ? 'AI Copilot'
        : state === 'thinking'   ? 'Analyzing...'
        : state === 'listening'  ? 'Listening...'
        : state === 'speaking'   ? 'Speaking'
        : state === 'celebrating'? 'Task Done!'
        :                          'Briefing'}
      </motion.div>
    </div>
  )
}
