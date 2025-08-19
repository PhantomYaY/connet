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
  Minus,
  Plus,
  Palette
} from 'lucide-react';

const WhiteboardPage = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [shapes, setShapes] = useState([]);
  const [textElements, setTextElements] = useState([]);
  const [isAddingText, setIsAddingText] = useState(false);
  const [currentShape, setCurrentShape] = useState(null);

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

    // Set canvas size
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
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

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Redraw shapes
    shapes.forEach(shape => {
      context.beginPath();
      context.strokeStyle = shape.color;
      context.lineWidth = shape.width;

      if (shape.type === 'rectangle') {
        context.rect(shape.x, shape.y, shape.w, shape.h);
      } else if (shape.type === 'circle') {
        context.arc(shape.x + shape.w/2, shape.y + shape.h/2, Math.abs(shape.w/2), 0, 2 * Math.PI);
      }
      context.stroke();
    });

    // Redraw text elements
    textElements.forEach(textEl => {
      context.font = `${textEl.size}px Arial`;
      context.fillStyle = textEl.color;
      context.fillText(textEl.text, textEl.x, textEl.y);
    });
  }, [shapes, textElements]);

  const startDrawing = ({ nativeEvent }) => {
    if (tool === 'text') {
      setIsAddingText(true);
      const { offsetX, offsetY } = nativeEvent;
      const text = prompt('Enter text:');
      if (text) {
        const newTextElement = {
          id: Date.now(),
          text,
          x: offsetX,
          y: offsetY,
          color: strokeColor,
          size: strokeWidth * 6
        };
        setTextElements(prev => [...prev, newTextElement]);
      }
      setIsAddingText(false);
      return;
    }

    if (tool === 'rectangle' || tool === 'circle') {
      const { offsetX, offsetY } = nativeEvent;
      setCurrentShape({
        type: tool,
        startX: offsetX,
        startY: offsetY,
        x: offsetX,
        y: offsetY,
        w: 0,
        h: 0,
        color: strokeColor,
        width: strokeWidth
      });
      setIsDrawing(true);
      return;
    }

    if (tool === 'pen' || tool === 'eraser') {
      const { offsetX, offsetY } = nativeEvent;
      const context = contextRef.current;
      
      if (tool === 'eraser') {
        context.globalCompositeOperation = 'destination-out';
        context.lineWidth = strokeWidth * 3;
      } else {
        context.globalCompositeOperation = 'source-over';
        context.lineWidth = strokeWidth;
      }
      
      context.beginPath();
      context.moveTo(offsetX, offsetY);
      setIsDrawing(true);
    }
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;

    const { offsetX, offsetY } = nativeEvent;

    if (tool === 'rectangle' || tool === 'circle') {
      if (!currentShape) return;
      
      const context = contextRef.current;
      redrawCanvas();
      
      const w = offsetX - currentShape.startX;
      const h = offsetY - currentShape.startY;
      
      context.beginPath();
      context.strokeStyle = strokeColor;
      context.lineWidth = strokeWidth;
      
      if (tool === 'rectangle') {
        context.rect(currentShape.startX, currentShape.startY, w, h);
      } else if (tool === 'circle') {
        const radius = Math.abs(w / 2);
        context.arc(currentShape.startX + w/2, currentShape.startY + h/2, radius, 0, 2 * Math.PI);
      }
      context.stroke();
      return;
    }

    if (tool === 'pen' || tool === 'eraser') {
      const context = contextRef.current;
      context.lineTo(offsetX, offsetY);
      context.stroke();
    }
  };

  const stopDrawing = ({ nativeEvent }) => {
    if (!isDrawing) return;

    if (tool === 'rectangle' || tool === 'circle') {
      if (currentShape) {
        const { offsetX, offsetY } = nativeEvent;
        const w = offsetX - currentShape.startX;
        const h = offsetY - currentShape.startY;
        
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
    const context = contextRef.current;
    context.beginPath();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    setShapes([]);
    setTextElements([]);
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
        <div className="header-left">
          <button onClick={() => navigate('/dashboard')} className="back-btn">
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="tool-group">
            <button 
              className={`tool-btn ${tool === 'pen' ? 'active' : ''}`} 
              onClick={() => setTool('pen')}
              title="Pen"
            >
              <PenTool size={18} />
            </button>
            <button 
              className={`tool-btn ${tool === 'rectangle' ? 'active' : ''}`} 
              onClick={() => setTool('rectangle')}
              title="Rectangle"
            >
              <Square size={18} />
            </button>
            <button 
              className={`tool-btn ${tool === 'circle' ? 'active' : ''}`} 
              onClick={() => setTool('circle')}
              title="Circle"
            >
              <Circle size={18} />
            </button>
            <button 
              className={`tool-btn ${tool === 'text' ? 'active' : ''}`} 
              onClick={() => setTool('text')}
              title="Text"
            >
              <Type size={18} />
            </button>
            <button 
              className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`} 
              onClick={() => setTool('eraser')}
              title="Eraser"
            >
              <Eraser size={18} />
            </button>
          </div>

          <div className="tool-group">
            <div className="stroke-width-control">
              <button 
                onClick={() => setStrokeWidth(Math.max(1, strokeWidth - 1))}
                className="size-btn"
              >
                <Minus size={14} />
              </button>
              <span className="stroke-display">{strokeWidth}px</span>
              <button 
                onClick={() => setStrokeWidth(Math.min(20, strokeWidth + 1))}
                className="size-btn"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="tool-group">
            <div className="color-palette">
              <Palette size={16} />
              <div className="colors">
                {colors.map(color => (
                  <button
                    key={color}
                    className={`color-btn ${strokeColor === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setStrokeColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <div className="tool-group">
            <button className="action-btn" onClick={downloadCanvas} title="Download">
              <Download size={16} />
              Download
            </button>
            <button className="action-btn danger" onClick={clearCanvas} title="Clear All">
              <Trash2 size={16} />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="canvas-container">
        {/* Grid Background */}
        <div className="grid-background" />
        
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className="whiteboard-canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
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
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    z-index: 10;
    
    .dark & {
      background: rgba(15, 23, 42, 0.95);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
  }

  .header-left {
    display: flex;
    align-items: center;
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 0.75rem;
    color: #374151;
    font-weight: 500;
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

  .toolbar {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .tool-group {
    display: flex;
    gap: 0.25rem;
    align-items: center;
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 0.75rem;
    padding: 0.25rem;
    
    .dark & {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
  }

  .tool-btn {
    padding: 0.75rem;
    background: none;
    border: none;
    border-radius: 0.5rem;
    color: #6b7280;
    transition: all 0.2s;
    cursor: pointer;
    
    .dark & {
      color: #9ca3af;
    }
    
    &:hover, &.active {
      background: rgba(59, 130, 246, 0.1);
      color: #2563eb;
      
      .dark & {
        background: rgba(96, 165, 250, 0.1);
        color: #60a5fa;
      }
    }
  }

  .stroke-width-control {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
  }

  .size-btn {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    background: none;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s;
    
    .dark & {
      color: #9ca3af;
      border-color: rgba(255, 255, 255, 0.2);
    }
    
    &:hover {
      background: rgba(59, 130, 246, 0.1);
      color: #2563eb;
      
      .dark & {
        color: #60a5fa;
      }
    }
  }

  .stroke-display {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    min-width: 35px;
    text-align: center;
    
    .dark & {
      color: #d1d5db;
    }
  }

  .color-palette {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    
    .colors {
      display: flex;
      gap: 0.25rem;
    }
  }

  .color-btn {
    width: 24px;
    height: 24px;
    border: 2px solid transparent;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;
    
    &.active {
      border-color: #2563eb;
      transform: scale(1.1);
    }
    
    &:hover {
      transform: scale(1.1);
    }
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 0.75rem;
    color: #374151;
    font-weight: 500;
    font-size: 0.875rem;
    transition: all 0.2s;
    cursor: pointer;
    
    .dark & {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #d1d5db;
    }
    
    &:hover {
      background: rgba(59, 130, 246, 0.1);
      border-color: rgba(59, 130, 246, 0.3);
      color: #2563eb;
      
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
    
    &.text-mode {
      cursor: text;
    }
  }

  @media (max-width: 768px) {
    .header {
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
    }
    
    .toolbar {
      flex-wrap: wrap;
      justify-content: center;
    }
    
    .tool-group {
      flex-wrap: wrap;
    }
  }
`;

export default WhiteboardPage;
