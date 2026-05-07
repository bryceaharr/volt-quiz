"use client";

import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "motion/react";
import { Users } from "lucide-react";

type Player = { id: string; displayName: string; avatarSeed: string };

export function LobbyPanel({
  code,
  joinUrl,
  players,
  quizTitle,
}: {
  code: string;
  joinUrl: string;
  players: Player[];
  quizTitle: string;
}) {
  const joinHost = (() => {
    try {
      const u = new URL(joinUrl);
      return `${u.host}/join/${code}`;
    } catch {
      return joinUrl;
    }
  })();

  return (
    <div className="flex-1 grid lg:grid-cols-[minmax(0,1fr)_minmax(380px,420px)] gap-6 mt-2">
      {/* Big visual side */}
      <div className="glass-strong rounded-3xl p-8 lg:p-12 flex flex-col items-center justify-center gap-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_30%_20%,oklch(0.72_0.21_295/0.3),transparent_60%),radial-gradient(circle_at_80%_80%,oklch(0.78_0.16_195/0.2),transparent_60%)]" />

        <div className="relative space-y-2 text-center">
          <p className="text-muted-foreground uppercase tracking-widest text-xs">
            Now hosting
          </p>
          <h1 className="text-3xl lg:text-4xl font-bold">{quizTitle}</h1>
        </div>

        <div className="relative space-y-3 text-center">
          <p className="text-muted-foreground text-sm">Go to</p>
          <p className="text-2xl lg:text-3xl font-mono font-semibold text-gradient break-all">
            {joinHost}
          </p>
        </div>

        <div className="relative flex flex-col items-center gap-3">
          <p className="text-muted-foreground text-sm uppercase tracking-widest">
            Game code
          </p>
          <p className="text-7xl lg:text-9xl font-bold font-mono tracking-[0.15em] tabular-nums leading-none">
            {code}
          </p>
        </div>

        <div className="relative bg-white p-4 rounded-2xl">
          <QRCodeSVG value={joinUrl} size={180} bgColor="#ffffff" fgColor="#0d0d12" />
        </div>
      </div>

      {/* Player list side */}
      <div className="glass rounded-3xl p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="size-5 text-accent" />
            Players
          </h2>
          <span className="text-2xl font-bold tabular-nums text-gradient">
            {players.length}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto -mx-2 px-2">
          {players.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground gap-3 py-12">
              <div className="relative">
                <div className="size-12 rounded-full bg-primary/20" />
                <div className="absolute inset-0 size-12 rounded-full border border-primary pulse-ring" />
              </div>
              <p className="text-sm">Waiting for players to join…</p>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-2">
              <AnimatePresence initial={false}>
                {players.map((p) => (
                  <motion.li
                    key={p.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 300, damping: 24 }}
                    className="glass rounded-xl px-3 py-2.5 flex items-center gap-2 truncate"
                  >
                    <div
                      className="size-7 rounded-full grid place-items-center text-[10px] font-bold uppercase shrink-0"
                      style={{ background: avatarColor(p.avatarSeed) }}
                    >
                      {p.displayName.slice(0, 2)}
                    </div>
                    <span className="truncate text-sm">{p.displayName}</span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function avatarColor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const hue = Math.abs(h) % 360;
  return `linear-gradient(135deg, oklch(0.72 0.18 ${hue}), oklch(0.65 0.2 ${(hue + 60) % 360}))`;
}
