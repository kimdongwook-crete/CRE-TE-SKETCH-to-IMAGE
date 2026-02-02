import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Pen, Eraser, Trash2, Undo, ImageIcon, Camera } from 'lucide-react';

interface CanvasBoardProps {
  onImageChange: (hasImage: boolean) => void;
}

export interface CanvasRef {
  exportImage: () => string | null;
  clear: () => void;
}

const COLORS = ['#FFD700', '#000000', '#FF0000', '#0000FF', '#008000', '#FFFFFF'];
const ERASER_SIZES = [10, 20, 30, 50, 70, 100];

const CanvasBoard = forwardRef<CanvasRef, CanvasBoardProps>(({ onImageChange }, ref) => {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null); // Layer 0: Background (Image/White)
  const drawCanvasRef = useRef<HTMLCanvasElement>(null); // Layer 1: Strokes
  const containerRef = useRef<HTMLDivElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser' | null>(null);
  const [activeColor, setActiveColor] = useState('#000000');
  const [eraserSize, setEraserSize] = useState(30);
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [history, setHistory] = useState<ImageData[]>([]);

  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [showCursor, setShowCursor] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Helper: Paint the background layer
  const paintBackground = () => {
    const bgCanvas = bgCanvasRef.current;
    if (!bgCanvas) return;
    const ctx = bgCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

    if (backgroundImage) {
      drawImageProp(ctx, backgroundImage, 0, 0, bgCanvas.width, bgCanvas.height);
    }
  };

  // Helper: Handle Resizing (Layout)
  const handleResize = () => {
    const bgCanvas = bgCanvasRef.current;
    const drawCanvas = drawCanvasRef.current;
    const container = containerRef.current;

    if (!bgCanvas || !drawCanvas || !container) return;

    const { clientWidth, clientHeight } = container;
    if (clientWidth === 0 || clientHeight === 0) return;

    // Only update and clear if dimensions actually changed
    if (bgCanvas.width !== clientWidth || bgCanvas.height !== clientHeight) {
      // Save current drawing
      const drawCtx = drawCanvas.getContext('2d');
      let savedData: ImageData | null = null;
      if (drawCtx && drawCanvas.width > 0 && drawCanvas.height > 0) {
        savedData = drawCtx.getImageData(0, 0, drawCanvas.width, drawCanvas.height);
      }

      bgCanvas.width = clientWidth;
      bgCanvas.height = clientHeight;
      drawCanvas.width = clientWidth;
      drawCanvas.height = clientHeight;

      const newDrawCtx = drawCanvas.getContext('2d');
      if (newDrawCtx) {
        newDrawCtx.lineCap = 'round';
        newDrawCtx.lineJoin = 'round';
        if (savedData) {
          newDrawCtx.putImageData(savedData, 0, 0);
        }
      }

      // Re-paint background after resize
      paintBackground();
    }
  };

  // Effect: Initialization & Resize Listener
  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Effect: Re-paint background when image changes (FIX for missing image)
  useEffect(() => {
    paintBackground();
  }, [backgroundImage]);

  // Handle Paste
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const img = new Image();
              img.onload = () => {
                setBackgroundImage(img);
                onImageChange(true);
              };
              img.src = event.target?.result as string;
            };
            reader.readAsDataURL(blob);
          }
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  useImperativeHandle(ref, () => ({
    exportImage: () => {
      const bgCanvas = bgCanvasRef.current;
      const drawCanvas = drawCanvasRef.current;
      if (!bgCanvas || !drawCanvas) return null;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = bgCanvas.width;
      tempCanvas.height = bgCanvas.height;
      const ctx = tempCanvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(bgCanvas, 0, 0);
        ctx.drawImage(drawCanvas, 0, 0);
        return tempCanvas.toDataURL('image/png');
      }
      return null;
    },
    clear: handleClear
  }));

  const saveState = () => {
    const canvas = drawCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      setHistory(prev => [...prev.slice(-10), ctx.getImageData(0, 0, canvas.width, canvas.height)]);
    }
  };

  const handleUndo = () => {
    const canvas = drawCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx && history.length > 0) {
      const newHistory = [...history];
      const previousState = newHistory.pop();
      setHistory(newHistory);
      if (previousState) {
        ctx.putImageData(previousState, 0, 0);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setBackgroundImage(img);
          onImageChange(true);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if (window.TouchEvent && e instanceof TouchEvent || 'touches' in e) {
      const te = e as unknown as React.TouchEvent;
      if (te.touches.length > 0) {
        clientX = te.touches[0].clientX;
        clientY = te.touches[0].clientY;
      } else {
        clientX = te.changedTouches[0].clientX;
        clientY = te.changedTouches[0].clientY;
      }
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      offsetX: clientX! - rect.left,
      offsetY: clientY! - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!tool) return;
    const canvas = drawCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    saveState();
    setIsDrawing(true);

    const { offsetX, offsetY } = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = eraserSize;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = 2;
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = drawCanvasRef.current;
    if (tool === 'eraser' && canvas) {
      const { offsetX, offsetY } = getCoordinates(e, canvas);
      setCursorPos({ x: offsetX, y: offsetY });
    }

    if (!isDrawing || !tool) return;
    const canvasEl = drawCanvasRef.current;
    const ctx = canvasEl?.getContext('2d');
    if (!canvasEl || !ctx) return;

    const { offsetX, offsetY } = getCoordinates(e, canvasEl);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    const canvas = drawCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) ctx.closePath();
    setIsDrawing(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setBackgroundImage(img);
          onImageChange(true);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  function handleClear() {
    const bgCanvas = bgCanvasRef.current;
    const drawCanvas = drawCanvasRef.current;

    if (bgCanvas && drawCanvas) {
      const bgCtx = bgCanvas.getContext('2d');
      const drawCtx = drawCanvas.getContext('2d');

      if (bgCtx && drawCtx) {
        bgCtx.fillStyle = '#FFFFFF';
        bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
        drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
      }
    }
    setBackgroundImage(null);
    onImageChange(false);
    setHistory([]);
  }

  function drawImageProp(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, offsetX = 0.5, offsetY = 0.5) {
    if (arguments.length === 2) {
      x = y = 0;
      w = ctx.canvas.width;
      h = ctx.canvas.height;
    }
    offsetX = typeof offsetX === "number" ? offsetX : 0.5;
    offsetY = typeof offsetY === "number" ? offsetY : 0.5;

    // Constraint check
    if (offsetX < 0) offsetX = 0;
    if (offsetY < 0) offsetY = 0;
    if (offsetX > 1) offsetX = 1;
    if (offsetY > 1) offsetY = 1;

    var iw = img.width, ih = img.height, r = Math.min(w / iw, h / ih), nw = iw * r, nh = ih * r;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, iw, ih, x + (w - nw) * offsetX, y + (h - nh) * offsetY, nw, nh);
  }

  const penCursor = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23000000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z'%3E%3C/path%3E%3C/svg%3E") 0 24, auto`;

  return (
    <div className="relative w-full h-full flex flex-col bg-white overflow-hidden select-none touch-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Restored Toolbar: Gap-0 (Merged) as requested */}
      <div className="absolute top-4 left-4 z-30 flex flex-col gap-0 p-0 shadow-none">

        {/* Pen Tool */}
        <div className="relative group bg-white border border-black shadow-sm">
          <button
            onClick={() => setTool(tool === 'pen' ? null : 'pen')}
            className={`p-2 transition-colors w-full flex items-center justify-center ${tool === 'pen' ? 'bg-black text-white' : 'hover:bg-gray-100 text-black'}`}
            title="Pen"
          >
            <Pen size={16} />
          </button>

          {tool === 'pen' && (
            <div className="absolute left-full top-0 ml-2 border border-black bg-white flex flex-row h-full items-center px-2 py-1 gap-2 w-max shadow-sm z-40">
              {COLORS.map(color => (
                <button
                  key={color}
                  onClick={(e) => { e.stopPropagation(); setActiveColor(color); }}
                  className={`w-5 h-5 rounded-full border border-gray-200 hover:scale-110 transition-transform ${activeColor === color ? 'ring-2 ring-black ring-offset-1' : ''}`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          )}
        </div>

        {/* Eraser Tool */}
        <div className="relative group bg-white border border-black shadow-sm -mt-px">
          <button
            onClick={() => setTool(tool === 'eraser' ? null : 'eraser')}
            className={`p-2 transition-colors w-full flex items-center justify-center ${tool === 'eraser' ? 'bg-black text-white' : 'hover:bg-gray-100 text-black'}`}
            title="Eraser"
          >
            <Eraser size={16} />
          </button>

          {tool === 'eraser' && (
            <div className="absolute left-full top-0 ml-2 border border-black bg-white flex flex-row h-full items-center px-2 py-1 gap-2 w-max shadow-sm z-40">
              {ERASER_SIZES.map(size => (
                <button
                  key={size}
                  onClick={(e) => { e.stopPropagation(); setEraserSize(size); }}
                  className={`rounded-full border border-black hover:bg-gray-200 transition-colors flex items-center justify-center ${eraserSize === size ? 'bg-black' : 'bg-transparent'}`}
                  style={{ width: Math.min(24, size / 2 + 4), height: Math.min(24, size / 2 + 4) }}
                >
                  <div
                    className={`rounded-full ${eraserSize === size ? 'bg-white' : 'bg-black'}`}
                    style={{ width: size / 4, height: size / 4 }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Undo */}
        <div className="bg-white border border-black shadow-sm -mt-px">
          <button
            onClick={handleUndo}
            className="p-2 hover:bg-gray-100 text-black transition-colors flex items-center justify-center w-full"
            title="Undo"
          >
            <Undo size={16} />
          </button>
        </div>

        {/* Clear */}
        <div className="bg-white border border-black shadow-sm -mt-px">
          <button
            onClick={handleClear}
            className="p-2 hover:bg-red-50 text-red-600 transition-colors flex items-center justify-center w-full"
            title="Clear Canvas"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Upload Buttons */}
      {
        !backgroundImage && (
          <div className="absolute top-4 right-4 z-30 flex gap-0 border border-black bg-white shadow-none">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-gray-100 text-black flex items-center gap-2 px-3 font-display text-base tracking-wide"
            >
              <ImageIcon size={16} />
              <span>UPLOAD</span>
            </button>
            <div className="w-px bg-black h-full"></div>
            <label className="lg:hidden p-2 hover:bg-gray-100 text-black flex items-center gap-2 px-3 font-display text-base tracking-wide cursor-pointer">
              <Camera size={16} />
              <span>CAMERA</span>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
            </label>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
          </div>
        )
      }

      {/* Canvas Area with Layers (User Verified Structure) */}
      <div
        ref={containerRef}
        className="flex-1 bg-white relative touch-none overflow-hidden"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag Overlay - Text Removed, Lighter Background */}
        {isDragging && (
          <div className="absolute inset-0 bg-black/2 border-4 border-dashed border-gray-100/50 z-50 pointer-events-none flex items-center justify-center">
            {/* Minimal visual feedback only */}
          </div>
        )}

        {/* Custom Eraser Cursor */}
        {
          tool === 'eraser' && showCursor && (
            <div
              className="pointer-events-none absolute border border-gray-500 rounded-full z-50 transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: cursorPos.x,
                top: cursorPos.y,
                width: eraserSize,
                height: eraserSize,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderColor: 'black'
              }}
            />
          )
        }

        {/* Layer 0: Background (Image/White) */}
        <canvas
          ref={bgCanvasRef}
          className="absolute inset-0 pointer-events-none z-0"
        />

        {/* Layer 1: Drawing (Pen Strokes) */}
        <canvas
          ref={drawCanvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={() => { stopDrawing(); setShowCursor(false); }}
          onMouseEnter={() => setShowCursor(true)}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 block w-full h-full z-10"
          style={{
            cursor: tool === 'pen' ? penCursor : (tool === 'eraser' ? 'none' : 'auto')
          }}
        />
      </div >
    </div >
  );
});

export default CanvasBoard;