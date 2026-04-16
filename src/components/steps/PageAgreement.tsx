"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import { ContinueButton } from "@/components/ui/Field";
import type { AgreementData } from "@/lib/types";

type Props = {
  agreement: AgreementData;
  update: (fields: Partial<AgreementData>) => void;
  onNext: () => void;
};

export default function PageAgreement({ agreement, update, onNext }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);

  const getPoint = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    drawing.current = true;
    const p = getPoint(e);
    if (!p) return;
    const ctx = canvasRef.current?.getContext("2d");
    ctx?.beginPath();
    ctx?.moveTo(p.x, p.y);
  };

  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    e.preventDefault();
    const p = getPoint(e);
    if (!p) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#c9a84c";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };

  const stop = () => {
    drawing.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    update({ signatureData: dataUrl, agreed: true });
    setHasSignature(true);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    update({ signatureData: "", agreed: false });
    setHasSignature(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold mb-1">Agreement & signature</h1>
        <p className="text-muted text-sm">
          Quick review before you sign. This protects both of us.
        </p>
      </div>

      <div className="border border-card-border rounded-xl p-5 max-h-72 overflow-y-auto text-sm leading-relaxed space-y-3">
        <p>
          <strong className="text-foreground">Your broker</strong> — 1 OF 1 AUTO INC. is helping you find, negotiate, and finalize your vehicle. We&apos;re not a dealer; we work directly with dealers on your behalf to get you better terms than you&apos;d find on your own.
        </p>
        <p>
          <strong className="text-foreground">The deposit</strong> — A $500 Service Commitment Fee is due when you sign. This is applied toward what you&apos;d pay for the service. It&apos;s refundable if we can&apos;t complete the deal on our side, and non-refundable if you decide to shop elsewhere after we&apos;ve done the work.
        </p>
        <p>
          <strong className="text-foreground">Working together</strong> — While we&apos;re working on your deal, please let us handle dealer communications. Reaching out directly to dealers we&apos;ve introduced can disrupt the deal structure. If something feels off, just call us first.
        </p>
        <p>
          <strong className="text-foreground">What we don&apos;t control</strong> — Financing approvals, manufacturer delays, dealer inventory, and DMV processing are handled by those parties. We&apos;ll advocate for you but can&apos;t guarantee their timelines.
        </p>
        <p>
          <strong className="text-foreground">Timeframe</strong> — This agreement is active for 30 days. Florida law governs, venue in Broward County.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Sign below to agree</label>
          {hasSignature && (
            <button onClick={clear} className="text-xs text-muted hover:text-foreground">
              Clear
            </button>
          )}
        </div>
        <canvas
          ref={canvasRef}
          width={400}
          height={140}
          className="w-full h-36 bg-card border border-card-border rounded-xl touch-none cursor-crosshair"
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={stop}
          onMouseLeave={stop}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={stop}
        />
        {!hasSignature && (
          <p className="text-xs text-muted mt-2">Use your finger or mouse to sign.</p>
        )}
      </motion.div>

      <ContinueButton onClick={onNext} disabled={!agreement.agreed}>
        Continue to deposit
      </ContinueButton>
    </div>
  );
}
