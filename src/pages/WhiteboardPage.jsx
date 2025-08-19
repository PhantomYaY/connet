import React, { useRef, useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  PenTool, 
  Square, 
  Circle, 
  Type, 
  Eraser, 
  Download, 
  Trash2,
  Triangle,
  Diamond,
  Star,
  ArrowUp,
  Heart,
  Hexagon,
  ChevronDown,
  ChevronRight,
  Move
} from 'lucide-react';

const WhiteboardPage = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [tool, setTool] = useState('pen');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [shapes, setShapes] = useState([]);
  const [textElements, setTextElements] = useState([]);
  const [drawPaths, setDrawPaths] = useState([]);
  const [isAddingText, setIsAddingText] = useState(false);
  const [currentShape, setCurrentShape] = useState(null);
  const [shapesExpanded, setShapesExpanded] = useState(false);
  
  // Pan and zoom state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  // Shape tools
  const shapeTools = [
    { name: 'rectangle', icon: Square, label: 'Rectangle' },
    { name: 'circle', icon: Circle, label: 'Circle' },
    { name: 'triangle', icon: Triangle, label: 'Triangle' },
    { name: 'diamond', icon: Diamond, label: 'Diamond' },
    { name: 'star', icon: Star, label: 'Star' },
    { name: 'arrow', icon: ArrowUp, label: 'Arrow' },
    { name: 'heart', icon: Heart, label: 'Heart' },
    { name: 'hexagon', icon: Hexagon, label: 'Hexagon' }
  ];

  const basicTools = [
    { name: 'pen', icon: PenTool, label: 'Pen' },
    { name: 'text', icon: Type, label: 'Text' },
    { name: 'eraser', icon: Eraser, label: 'Eraser' },
    { name: 'pan', icon: Move, label: 'Pan' }
  ];

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = strokeColor;
    context.lineWidth = strokeWidth;
    contextRef.current = context;

    // Set canvas size to be larger for infinite area
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      canvas.width = container.offsetWidth * 3; // 3x wider
      canvas.height = container.offsetHeight * 3; // 3x taller
      canvas.style.width = `${container.offsetWidth * 3}px`;
      canvas.style.height = `${container.offsetHeight * 3}px`;
      redrawCanvas();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Update canvas properties when tool settings change
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = strokeColor;
      contextRef.current.lineWidth = strokeWidth;
    }
  }, [strokeColor, strokeWidth]);

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - pan.x) / scale,
      y: (e.clientY - rect.top - pan.y) / scale
    };
  };

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Save context
    context.save();

    // Apply transformations
    context.scale(scale, scale);
    context.translate(pan.x / scale, pan.y / scale);

    // Redraw drawing paths
    drawPaths.forEach(path => {
      context.beginPath();
      context.strokeStyle = path.color;
      context.lineWidth = path.width;
      context.globalCompositeOperation = path.operation || 'source-over';
      
      if (path.points.length > 0) {
        context.moveTo(path.points[0].x, path.points[0].y);
        path.points.forEach(point => {
          context.lineTo(point.x, point.y);
        });
      }
      context.stroke();
    });

    // Redraw shapes
    shapes.forEach(shape => {
      context.beginPath();
      context.strokeStyle = shape.color;
      context.lineWidth = shape.width;
      context.globalCompositeOperation = 'source-over';

      drawShape(context, shape);
      context.stroke();
    });

    // Redraw text elements
    textElements.forEach(textEl => {
      context.font = `${textEl.size}px Arial`;
      context.fillStyle = textEl.color;
      context.globalCompositeOperation = 'source-over';
      context.fillText(textEl.text, textEl.x, textEl.y);
    });

    // Restore context
    context.restore();
  }, [shapes, textElements, drawPaths, pan, scale]);

  const drawShape = (context, shape) => {
    const { type, x, y, w, h } = shape;
    
    switch (type) {
      case 'rectangle':
        context.rect(x, y, w, h);
        break;
      case 'circle':
        context.arc(x + w/2, y + h/2, Math.abs(w/2), 0, 2 * Math.PI);
        break;
      case 'triangle':
        context.moveTo(x + w/2, y);
        context.lineTo(x, y + h);
        context.lineTo(x + w, y + h);
        context.closePath();
        break;
      case 'diamond':
        context.moveTo(x + w/2, y);
        context.lineTo(x + w, y + h/2);
        context.lineTo(x + w/2, y + h);
        context.lineTo(x, y + h/2);
        context.closePath();
        break;
      case 'star':
        drawStar(context, x + w/2, y + h/2, 5, Math.abs(w/4), Math.abs(w/8));
        break;
      case 'arrow':
        const arrowW = Math.abs(w/3);
        context.moveTo(x + w/2, y);
        context.lineTo(x + w/2 - arrowW, y + h/3);
        context.lineTo(x + w/2 - arrowW/2, y + h/3);
        context.lineTo(x + w/2 - arrowW/2, y + h);
        context.lineTo(x + w/2 + arrowW/2, y + h);
        context.lineTo(x + w/2 + arrowW/2, y + h/3);
        context.lineTo(x + w/2 + arrowW, y + h/3);
        context.closePath();
        break;
      case 'heart':
        drawHeart(context, x + w/2, y + h/4, Math.abs(w/4));
        break;
      case 'hexagon':
        drawHexagon(context, x + w/2, y + h/2, Math.abs(w/2));
        break;
    }
  };

  const drawStar = (context, cx, cy, spikes, outerRadius, innerRadius) => {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    context.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      context.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      context.lineTo(x, y);
      rot += step;
    }
    context.lineTo(cx, cy - outerRadius);
    context.closePath();
  };

  const drawHeart = (context, cx, cy, size) => {
    context.moveTo(cx, cy + size);
    context.bezierCurveTo(cx, cy + size - size/2, cx - size, cy - size/2, cx - size, cy);
    context.bezierCurveTo(cx - size, cy - size, cx, cy - size, cx, cy - size/2);
    context.bezierCurveTo(cx, cy - size, cx + size, cy - size, cx + size, cy);
    context.bezierCurveTo(cx + size, cy - size/2, cx, cy + size - size/2, cx, cy + size);
    context.closePath();
  };

  const drawHexagon = (context, cx, cy, radius) => {
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      if (i === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }
    context.closePath();
  };

  const startDrawing = (e) => {
    const pos = getMousePos(e);

    if (tool === 'pan') {
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    if (tool === 'text') {
      setIsAddingText(true);
      const text = prompt('Enter text:');
      if (text) {
        const newTextElement = {
          id: Date.now(),
          text,
          x: pos.x,
          y: pos.y,
          color: strokeColor,
          size: strokeWidth * 6
        };
        setTextElements(prev => [...prev, newTextElement]);
      }
      setIsAddingText(false);
      return;
    }

    if (shapeTools.some(s => s.name === tool)) {
      setCurrentShape({
        type: tool,
        startX: pos.x,
        startY: pos.y,
        x: pos.x,
        y: pos.y,
        w: 0,
        h: 0,
        color: strokeColor,
        width: strokeWidth
      });
      setIsDrawing(true);
      return;
    }

    if (tool === 'pen' || tool === 'eraser') {
      const context = contextRef.current;
      
      if (tool === 'eraser') {
        context.globalCompositeOperation = 'destination-out';
        context.lineWidth = strokeWidth * 3;
      } else {
        context.globalCompositeOperation = 'source-over';
        context.lineWidth = strokeWidth;
      }
      
      const newPath = {
        points: [{ x: pos.x, y: pos.y }],
        color: strokeColor,
        width: strokeWidth,
        operation: tool === 'eraser' ? 'destination-out' : 'source-over'
      };
      
      setDrawPaths(prev => [...prev, newPath]);
      setIsDrawing(true);
    }
  };

  const draw = (e) => {
    const pos = getMousePos(e);

    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      setPan(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    if (!isDrawing) return;

    if (shapeTools.some(s => s.name === tool)) {
      if (!currentShape) return;
      
      const context = contextRef.current;
      redrawCanvas();
      
      // Draw preview shape
      context.save();
      context.scale(scale, scale);
      context.translate(pan.x / scale, pan.y / scale);
      
      const w = pos.x - currentShape.startX;
      const h = pos.y - currentShape.startY;
      
      context.beginPath();
      context.strokeStyle = strokeColor;
      context.lineWidth = strokeWidth;
      
      const previewShape = {
        type: tool,
        x: currentShape.startX,
        y: currentShape.startY,
        w, h
      };
      
      drawShape(context, previewShape);
      context.stroke();
      context.restore();
      return;
    }

    if (tool === 'pen' || tool === 'eraser') {
      setDrawPaths(prev => {
        const newPaths = [...prev];
        const currentPath = newPaths[newPaths.length - 1];
        if (currentPath) {
          currentPath.points.push({ x: pos.x, y: pos.y });
        }
        return newPaths;
      });
      redrawCanvas();
    }
  };

  const stopDrawing = (e) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (!isDrawing) return;

    if (shapeTools.some(s => s.name === tool)) {
      if (currentShape) {
        const pos = getMousePos(e);
        const w = pos.x - currentShape.startX;
        const h = pos.y - currentShape.startY;
        
        const newShape = {
          ...currentShape,
          w,
          h
        };
        setShapes(prev => [...prev, newShape]);
        setCurrentShape(null);
      }
    }

    setIsDrawing(false);
    redrawCanvas();
  };

  const clearCanvas = () => {
    setShapes([]);
    setTextElements([]);
    setDrawPaths([]);
    redrawCanvas();
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'whiteboard.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500'];

  return (
    <StyledWrapper className="bg-slate-100 dark:bg-slate-900">
      {/* Header */}
      <div className="header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Side Panel */}
        <div className="side-panel">
          <div className="panel-section">
            <h3>Tools</h3>
            <div className="tools-grid">
              {basicTools.map(({ name, icon: Icon, label }) => (
                <button 
                  key={name}
                  className={`tool-btn ${tool === name ? 'active' : ''}`} 
                  onClick={() => setTool(name)}
                  title={label}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="panel-section">
            <button 
              className="shapes-header"
              onClick={() => setShapesExpanded(!shapesExpanded)}
            >
              <h3>Shapes</h3>
              {shapesExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {shapesExpanded && (
              <div className="shapes-grid">
                {shapeTools.map(({ name, icon: Icon, label }) => (
                  <button 
                    key={name}
                    className={`tool-btn ${tool === name ? 'active' : ''}`} 
                    onClick={() => setTool(name)}
                    title={label}
                  >
                    <Icon size={16} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="panel-section">
            <h3>Stroke</h3>
            <div className="stroke-controls">
              <label className="slider-label">Width: {strokeWidth}px</label>
              <input
                type="range"
                min="1"
                max="20"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                className="stroke-slider"
              />
              <div className="stroke-preview">
                <div 
                  className="stroke-line" 
                  style={{ 
                    height: `${strokeWidth}px`, 
                    backgroundColor: strokeColor 
                  }}
                />
              </div>
            </div>
          </div>

          <div className="panel-section">
            <h3>Colors</h3>
            <div className="color-grid">
              {colors.map(color => (
                <button
                  key={color}
                  className={`color-btn ${strokeColor === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setStrokeColor(color)}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className="panel-section">
            <h3>Actions</h3>
            <div className="actions-grid">
              <button className="action-btn" onClick={downloadCanvas} title="Download">
                <Download size={16} />
                <span>Download</span>
              </button>
              <button className="action-btn danger" onClick={clearCanvas} title="Clear All">
                <Trash2 size={16} />
                <span>Clear</span>
              </button>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="canvas-container" ref={containerRef}>
          {/* Grid Background */}
          <div className="grid-background" />
          
          {/* Canvas */}
          <canvas
            ref={canvasRef}
            className={`whiteboard-canvas ${tool === 'pan' ? 'pan-cursor' : ''}`}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        </div>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;

  .header {
    display: flex;
    align-items: center;
    padding: 0.75rem 1.5rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    z-index: 10;
    
    .dark & {
      background: rgba(15, 23, 42, 0.95);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
  }

  .main-content {
    flex: 1;
    display: flex;
    height: calc(100vh - 60px);
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.8rem;
    background: rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 0.5rem;
    color: #374151;
    font-weight: 500;
    font-size: 0.875rem;
    transition: all 0.2s;
    cursor: pointer;
    
    .dark & {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #d1d5db;
    }
    
    &:hover {
      background: rgba(0, 0, 0, 0.1);
      transform: translateY(-1px);
      
      .dark & {
        background: rgba(255, 255, 255, 0.1);
      }
    }
  }

  .side-panel {
    width: 220px;
    background: rgba(255, 255, 255, 0.95);
    border-right: 1px solid rgba(0, 0, 0, 0.1);
    padding: 1rem;
    overflow-y: auto;
    backdrop-filter: blur(20px);
    
    .dark & {
      background: rgba(15, 23, 42, 0.95);
      border-right: 1px solid rgba(255, 255, 255, 0.1);
    }
  }

  .panel-section {
    margin-bottom: 1.5rem;
    
    h3 {
      font-size: 0.75rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      
      .dark & {
        color: #d1d5db;
      }
    }
  }

  .shapes-header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    color: #374151;
    
    .dark & {
      color: #d1d5db;
    }
    
    &:hover {
      color: #2563eb;
      
      .dark & {
        color: #60a5fa;
      }
    }
  }

  .tools-grid, .shapes-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }

  .tool-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.75rem 0.5rem;
    background: rgba(0, 0, 0, 0.02);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 0.5rem;
    color: #6b7280;
    transition: all 0.2s;
    cursor: pointer;
    font-size: 0.625rem;
    font-weight: 500;
    
    .dark & {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #9ca3af;
    }
    
    &:hover, &.active {
      background: rgba(59, 130, 246, 0.1);
      border-color: rgba(59, 130, 246, 0.3);
      color: #2563eb;
      transform: translateY(-1px);
      
      .dark & {
        background: rgba(96, 165, 250, 0.1);
        border-color: rgba(96, 165, 250, 0.3);
        color: #60a5fa;
      }
    }
  }

  .stroke-controls {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .slider-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: #374151;
    
    .dark & {
      color: #d1d5db;
    }
  }

  .stroke-slider {
    width: 100%;
    height: 4px;
    border-radius: 2px;
    background: rgba(0, 0, 0, 0.1);
    outline: none;
    cursor: pointer;
    
    .dark & {
      background: rgba(255, 255, 255, 0.1);
    }
    
    &::-webkit-slider-thumb {
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #2563eb;
      cursor: pointer;
      
      .dark & {
        background: #60a5fa;
      }
    }
    
    &::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #2563eb;
      cursor: pointer;
      border: none;
      
      .dark & {
        background: #60a5fa;
      }
    }
  }

  .stroke-preview {
    padding: 0.75rem;
    background: rgba(0, 0, 0, 0.02);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 0.5rem;
    
    .dark & {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
  }

  .stroke-line {
    width: 100%;
    border-radius: 10px;
    transition: all 0.2s;
  }

  .color-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
  }

  .color-btn {
    width: 32px;
    height: 32px;
    border: 2px solid transparent;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
    
    &.active {
      border-color: #2563eb;
      transform: scale(1.05);
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
      
      .dark & {
        border-color: #60a5fa;
        box-shadow: 0 2px 8px rgba(96, 165, 250, 0.3);
      }
    }
    
    &:hover {
      transform: scale(1.05);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
  }

  .actions-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: rgba(0, 0, 0, 0.02);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 0.5rem;
    color: #374151;
    font-weight: 500;
    font-size: 0.75rem;
    transition: all 0.2s;
    cursor: pointer;
    
    .dark & {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #d1d5db;
    }
    
    &:hover {
      background: rgba(59, 130, 246, 0.1);
      border-color: rgba(59, 130, 246, 0.3);
      color: #2563eb;
      transform: translateY(-1px);
      
      .dark & {
        background: rgba(96, 165, 250, 0.1);
        border-color: rgba(96, 165, 250, 0.3);
        color: #60a5fa;
      }
    }

    &.danger:hover {
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.3);
      color: #ef4444;
    }
  }

  .canvas-container {
    flex: 1;
    position: relative;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.5);
    
    .dark & {
      background: rgba(15, 23, 42, 0.5);
    }
  }

  .grid-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
    background-size: 20px 20px;
    pointer-events: none;
    
    .dark & {
      background-image: 
        linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
    }
  }

  .whiteboard-canvas {
    position: absolute;
    top: 0;
    left: 0;
    cursor: crosshair;
    background: transparent;
    
    &.pan-cursor {
      cursor: grab;
      
      &:active {
        cursor: grabbing;
      }
    }
  }

  @media (max-width: 768px) {
    .header {
      padding: 0.75rem;
    }
    
    .main-content {
      flex-direction: column;
      height: calc(100vh - 50px);
    }
    
    .side-panel {
      width: 100%;
      height: auto;
      max-height: 180px;
      padding: 0.75rem;
      border-right: none;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      
      .dark & {
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
    }
    
    .panel-section {
      margin-bottom: 1rem;
      
      h3 {
        font-size: 0.625rem;
        margin-bottom: 0.5rem;
      }
    }
    
    .tools-grid, .shapes-grid {
      grid-template-columns: repeat(4, 1fr);
      gap: 0.25rem;
    }
    
    .tool-btn {
      padding: 0.5rem 0.25rem;
      font-size: 0.5rem;
      
      span {
        display: none;
      }
    }
    
    .color-grid {
      grid-template-columns: repeat(8, 1fr);
      gap: 0.25rem;
    }
    
    .color-btn {
      width: 24px;
      height: 24px;
    }
    
    .actions-grid {
      flex-direction: row;
      gap: 0.5rem;
    }
    
    .action-btn {
      padding: 0.5rem;
      font-size: 0.625rem;
      
      span {
        display: none;
      }
    }
  }
`;

export default WhiteboardPage;
