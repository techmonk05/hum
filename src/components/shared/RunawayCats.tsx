// src/components/shared/RunawayCat.tsx
"use client";
import { useEffect, useRef, useState } from "react";

// Sprite sheet info
// Total: 256x320px, each frame: 32x32px, 8 cols x 10 rows
// Row 0 (y=0):   idle 1 — 4 frames
// Row 1 (y=32):  idle 2 — 4 frames
// Row 2 (y=64):  clean 1 — 4 frames
// Row 3 (y=96):  clean 2 — 4 frames
// Row 4 (y=128): movement 1 (walk) — 8 frames
// Row 5 (y=160): movement 2 (run)  — 8 frames
// Row 6 (y=192): sleep — 4 frames
// Row 7 (y=224): paw — 4 frames
// Row 8 (y=256): jump — 4 frames
// Row 9 (y=288): scared — 4 frames

const FRAME_SIZE = 32;
const SCALE      = 3; // render at 96x96
const DISPLAY    = FRAME_SIZE * SCALE;

const ANIMS = {
  walk:   { row: 4, frames: 8, fps: 10 },
  run:    { row: 5, frames: 8, fps: 14 },
  idle:   { row: 0, frames: 4, fps:  6 },
  scared: { row: 9, frames: 4, fps: 10 },
  jump:   { row: 8, frames: 4, fps: 10 },
};

interface CatProps {
  startX: number;
  startY: number;
  speed: number;
  initialDir: { x: number; y: number };
  scale?: number;
}

function SpriteCat({ startX, startY, speed, initialDir, scale = SCALE }: CatProps) {
  const display = FRAME_SIZE * scale;

  const [pos, setPos]       = useState({ x: startX, y: startY });
  const [frame, setFrame]   = useState(0);
  const [anim, setAnim]     = useState<keyof typeof ANIMS>("walk");
  const [flipped, setFlipped] = useState(false);
  const [scared, setScared] = useState(false);

  const posRef    = useRef({ x: startX, y: startY });
  const dirRef    = useRef(initialDir);
  const frameRef  = useRef<number>(0);
  const animRef   = useRef<NodeJS.Timeout | null>(null);
  const scaredRef = useRef(false);
  const lastMove  = useRef<number>(0);

  // Sprite animation ticker
  useEffect(() => {
    let frameIdx = 0;
    const tick = () => {
      const currentAnim = scaredRef.current ? ANIMS.scared : ANIMS.walk;
      frameIdx = (frameIdx + 1) % currentAnim.frames;
      setFrame(frameIdx);
      animRef.current = setTimeout(tick, 1000 / currentAnim.fps);
    };
    animRef.current = setTimeout(tick, 100);
    return () => { if (animRef.current) clearTimeout(animRef.current); };
  }, []);

  // Movement loop
  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!lastMove.current) lastMove.current = timestamp;
      const delta = Math.min(timestamp - lastMove.current, 50);
      lastMove.current = timestamp;

      if (!scaredRef.current) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const maxX = ((vw - display) / vw) * 100;
        const maxY = ((vh - display - 80) / vh) * 100;

        let newX = posRef.current.x + dirRef.current.x * speed * delta;
        let newY = posRef.current.y + dirRef.current.y * speed * delta;
        let dx = dirRef.current.x;
        let dy = dirRef.current.y;

        if (newX <= 0)    { dx = Math.abs(dx);  newX = 0;    setFlipped(false); }
        if (newX >= maxX) { dx = -Math.abs(dx); newX = maxX; setFlipped(true); }
        if (newY <= 0)    { dy = Math.abs(dy);  newY = 0; }
        if (newY >= maxY) { dy = -Math.abs(dy); newY = maxY; }
        if (Math.random() < 0.001) dy = (Math.random() - 0.5) * 0.4;

        posRef.current = { x: newX, y: newY };
        dirRef.current = { x: dx, y: dy };
        setPos({ x: newX, y: newY });
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [speed, display]);

  const handleScare = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (scaredRef.current) return;
    scaredRef.current = true;
    setScared(true);
    setAnim("scared");

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let clientX = vw / 2, clientY = vh / 2;
    if ("touches" in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX; clientY = e.touches[0].clientY;
    } else if ("clientX" in e) {
      clientX = e.clientX; clientY = e.clientY;
    }

    const catX = (posRef.current.x / 100) * vw;
    const catY = (posRef.current.y / 100) * vh;
    const awayX = catX - clientX;
    const awayY = catY - clientY;
    const len = Math.sqrt(awayX * awayX + awayY * awayY) || 1;
    const maxX = ((vw - display) / vw) * 100;
    const maxY = ((vh - display - 80) / vh) * 100;

    const newX = Math.max(0, Math.min(maxX, posRef.current.x + (awayX / len) * 20));
    const newY = Math.max(0, Math.min(maxY, posRef.current.y + (awayY / len) * 20));

    posRef.current = { x: newX, y: newY };
    dirRef.current = { x: awayX / len > 0 ? 1 : -1, y: awayY / len > 0 ? 0.3 : -0.3 };
    setFlipped(awayX / len < 0);
    setPos({ x: newX, y: newY });

    setTimeout(() => {
      scaredRef.current = false;
      setScared(false);
      setAnim("walk");
    }, 1000);
  };

  const currentAnim = scared ? ANIMS.scared : ANIMS.walk;
  const spriteX = -(frame * FRAME_SIZE * scale);
  const spriteY = -(currentAnim.row * FRAME_SIZE * scale);

  return (
    <div
      onMouseEnter={handleScare}
      onTouchStart={handleScare}
      onClick={handleScare}
      style={{
        position: "fixed",
        left: `${pos.x}%`,
        top:  `${pos.y}%`,
        width:  display,
        height: display,
        zIndex: 49,
        cursor: "pointer",
        userSelect: "none",
        WebkitUserSelect: "none",
        imageRendering: "pixelated",
        transition: scared
          ? "left 0.4s cubic-bezier(0.34,1.56,0.64,1), top 0.4s cubic-bezier(0.34,1.56,0.64,1)"
          : "none",
        transform: `scaleX(${flipped ? -1 : 1})`,
        overflow: "hidden",
        background: "transparent",
      }}
    >
      <div
        style={{
          width:  256 * scale,
          height: 320 * scale,
          backgroundImage: "url('/cat-sprite.png')",
          backgroundSize: `${256 * scale}px ${320 * scale}px`,
          backgroundPosition: `${spriteX}px ${spriteY}px`,
          backgroundRepeat: "no-repeat",
          imageRendering: "pixelated",
          transform: `translate(0, 0)`,
        }}
      />
    </div>
  );
}

export default function RunawayCats() {
  return (
    <>
      <SpriteCat
        startX={15} startY={30}
        speed={0.022}
        initialDir={{ x: 1, y: 0.15 }}
        scale={3}
      />
      <SpriteCat
        startX={70} startY={55}
        speed={0.016}
        initialDir={{ x: -1, y: -0.2 }}
        scale={2.5}
      />
    </>
  );
}