import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Eraser, RotateCcw, Check, ShieldCheck } from 'lucide-react';

interface SignatureCanvasProps {
  onSignatureComplete: (signatureDataUrl: string) => void;
  onClear?: () => void;
  disabled?: boolean;
  initialSignature?: string;
  employeeName: string;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  onSignatureComplete,
  onClear,
  disabled = false,
  initialSignature,
  employeeName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI retina screens
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    if (canvas.width !== rect.width * ratio || canvas.height !== rect.height * ratio) {
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      ctx.scale(ratio, ratio);
    }

    ctx.strokeStyle = '#0f172a'; // Deep slate / black ink
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Clear background transparent
    if (initialSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasDrawn(true);
      };
      img.src = initialSignature;
    }
  }, [initialSignature]);

  useEffect(() => {
    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    return () => window.removeEventListener('resize', setupCanvas);
  }, [setupCanvas]);

  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    try {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory(prev => [...prev.slice(-10), imgData]);
    } catch {
      // ignore
    }
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else if ('clientX' in e) {
      return {
        x: (e as React.MouseEvent).clientX - rect.left,
        y: (e as React.MouseEvent).clientY - rect.top,
      };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    if ('touches' in e) {
      // Prevent scrolling while signing on mobile
      if (e.cancelable) e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    saveHistory();
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return;
    if ('touches' in e) {
      if (e.cancelable) e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSignatureComplete(dataUrl);
  };

  const handleClear = () => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const ratio = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / ratio, canvas.height / ratio);
    setHasDrawn(false);
    setHistory([]);
    if (onClear) onClear();
  };

  const handleUndo = () => {
    if (disabled || history.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = [...history];
    const prev = newHistory.pop();
    setHistory(newHistory);
    if (prev) {
      ctx.putImageData(prev, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');
      onSignatureComplete(dataUrl);
    } else {
      handleClear();
    }
  };

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-slate-600 px-1">
        <span className="font-medium flex items-center gap-1.5 text-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          서명란 ({employeeName} 님의 자필 서명)
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={disabled || history.length === 0}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-800 disabled:opacity-40 transition-colors text-xs px-1.5 py-0.5 rounded border border-slate-200"
          >
            <RotateCcw className="w-3 h-3" />
            되돌리기
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled || !hasDrawn}
            className="flex items-center gap-1 text-rose-600 hover:text-rose-700 disabled:opacity-40 transition-colors text-xs px-1.5 py-0.5 rounded border border-rose-200"
          >
            <Eraser className="w-3 h-3" />
            지우기
          </button>
        </div>
      </div>

      <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-amber-50/20 overflow-hidden touch-none h-44 shadow-inner">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {!hasDrawn && !disabled && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400">
            <span className="text-sm font-medium">여기에 손가락 또는 마우스로 정자 서명하세요</span>
            <span className="text-xs text-slate-400 mt-1">전자서명법 제3조에 따라 전자문서의 서명 효력이 보존됩니다</span>
          </div>
        )}

        {hasDrawn && (
          <div className="absolute bottom-2 right-2 pointer-events-none bg-emerald-50 text-emerald-700 text-[11px] font-medium px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
            <Check className="w-3 h-3" /> 서명 입력됨
          </div>
        )}
      </div>
    </div>
  );
};
