// Enhanced Whiteboard with Text Formatting and Popout Tools
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
  Move,
  Settings,
  X,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  Minus
} from 'lucide-react';

const WhiteboardPage = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isMiddleMousePanning, setIsMiddleMousePanning] = useState(false);
  const [tool, setTool] = useState('pen');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [shapes, setShapes] = useState([]);
  const [textElements, setTextElements] = useState([]);
  const [drawPaths, setDrawPaths] = useState([]);
  const [isAddingText, setIsAddingText] = useState(false);
  const [currentShape, setCurrentShape] = useState(null);
  const [shapesExpanded, setShapesExpanded] = useState(false);
  const [toolsPanelOpen, setToolsPanelOpen] = useState(false);
  
  // Text formatting state
  const [textModal, setTextModal] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [textAlign, setTextAlign] = useState('left');

  // Fill and editing state
  const [fillColor, setFillColor] = useState('#ffffff');
  const [hasFill, setHasFill] = useState(false);
  const [editingTextId, setEditingTextId] = useState(null);

  // Pan state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

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

  const fontFamilies = [
    'Arial', 'Times New Roman', 'Helvetica', 'Georgia', 'Verdana',
    'Comic Sans MS', 'Courier New', 'Impact', 'Trebuchet MS', 'Palatino'
  ];

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = strokeColor;
    context.lineWidth = strokeWidth;
    contextRef.current = context;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.strokeStyle = strokeColor;
      context.lineWidth = strokeWidth;
      
      redrawCanvas();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = strokeColor;
      contextRef.current.lineWidth = strokeWidth;
    }
  }, [strokeColor, strokeWidth]);

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left - pan.x,
      y: e.clientY - rect.top - pan.y
    };
  };

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.translate(pan.x, pan.y);

    // Redraw drawing paths
    drawPaths.forEach(path => {
      if (path.points && path.points.length > 1) {
        context.beginPath();
        context.strokeStyle = path.color;
        context.lineWidth = path.width;
        context.globalCompositeOperation = path.operation || 'source-over';
        
        context.moveTo(path.points[0].x, path.points[0].y);
        for (let i = 1; i < path.points.length; i++) {
          context.lineTo(path.points[i].x, path.points[i].y);
        }
        context.stroke();
      }
    });

    // Redraw shapes
    shapes.forEach(shape => {
      context.beginPath();
      context.strokeStyle = shape.color;
      context.lineWidth = shape.width;
      context.globalCompositeOperation = 'source-over';

      drawShape(context, shape);

      // Fill if shape has fill
      if (shape.hasFill && shape.fillColor) {
        context.fillStyle = shape.fillColor;
        context.fill();
      }

      context.stroke();
    });

    // Redraw text elements
    context.globalCompositeOperation = 'source-over';
    textElements.forEach(textEl => {
      context.font = `${textEl.bold ? 'bold' : 'normal'} ${textEl.italic ? 'italic' : 'normal'} ${textEl.size}px ${textEl.family}`;
      context.fillStyle = textEl.color;
      context.textAlign = textEl.align || 'left';
      context.fillText(textEl.text, textEl.x, textEl.y);
    });

    context.restore();
  }, [shapes, textElements, drawPaths, pan]);

  const drawShape = (context, shape) => {
    const { type, x, y, w, h } = shape;
    
    switch (type) {
      case 'rectangle':
        context.rect(x, y, w, h);
        break;
      case 'circle':
        const radius = Math.abs(Math.min(w, h) / 2);
        context.arc(x + w/2, y + h/2, radius, 0, 2 * Math.PI);
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
        drawStar(context, x + w/2, y + h/2, 5, Math.abs(Math.min(w, h)/4), Math.abs(Math.min(w, h)/8));
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
        drawHeart(context, x + w/2, y + h/4, Math.abs(Math.min(w, h)/4));
        break;
      case 'hexagon':
        drawHexagon(context, x + w/2, y + h/2, Math.abs(Math.min(w, h)/2));
        break;
    }
  };

  const drawStar = (context, cx, cy, spikes, outerRadius, innerRadius) => {
    let rot = Math.PI / 2 * 3;
    const step = Math.PI / spikes;

    context.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      const x = cx + Math.cos(rot) * outerRadius;
      const y = cy + Math.sin(rot) * outerRadius;
      context.lineTo(x, y);
      rot += step;

      const x2 = cx + Math.cos(rot) * innerRadius;
      const y2 = cy + Math.sin(rot) * innerRadius;
      context.lineTo(x2, y2);
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

  const openTextModal = (position, existingText = null) => {
    setTextModal(position);
    if (existingText) {
      setEditingTextId(existingText.id);
      setTextInput(existingText.text);
      setFontSize(existingText.size);
      setFontFamily(existingText.family);
      setIsBold(existingText.bold);
      setIsItalic(existingText.italic);
      setTextAlign(existingText.align);
      setStrokeColor(existingText.color);
    } else {
      setEditingTextId(null);
      setTextInput('');
      setFontSize(16);
      setFontFamily('Arial');
      setIsBold(false);
      setIsItalic(false);
      setTextAlign('left');
    }
  };

  const addTextElement = () => {
    if (textInput.trim() && textModal) {
      const textElement = {
        id: editingTextId || Date.now(),
        text: textInput.trim(),
        x: textModal.x,
        y: textModal.y,
        color: strokeColor,
        size: fontSize,
        family: fontFamily,
        bold: isBold,
        italic: isItalic,
        align: textAlign
      };

      if (editingTextId) {
        // Update existing text element
        setTextElements(prev => prev.map(text =>
          text.id === editingTextId ? textElement : text
        ));
      } else {
        // Add new text element
        setTextElements(prev => [...prev, textElement]);
      }

      setTextModal(null);
      setEditingTextId(null);

      // Instantly redraw canvas
      setTimeout(() => redrawCanvas(), 0);
    }
  };

  const checkTextClick = (pos) => {
    // Check if clicking on existing text for editing
    for (let i = textElements.length - 1; i >= 0; i--) {
      const textEl = textElements[i];
      const context = contextRef.current;
      if (!context) continue;

      context.font = `${textEl.bold ? 'bold' : 'normal'} ${textEl.italic ? 'italic' : 'normal'} ${textEl.size}px ${textEl.family}`;
      const metrics = context.measureText(textEl.text);
      const width = metrics.width;
      const height = textEl.size;

      // Check if click is within text bounds
      if (pos.x >= textEl.x && pos.x <= textEl.x + width &&
          pos.y >= textEl.y - height && pos.y <= textEl.y) {
        return textEl;
      }
    }
    return null;
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const pos = getMousePos(e);

    // Middle mouse button (button 1) for panning
    if (e.button === 1) {
      e.preventDefault();
      setIsMiddleMousePanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    // Only proceed with tool actions if it's left mouse button (button 0)
    if (e.button !== 0) return;

    if (tool === 'pan') {
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    if (tool === 'text') {
      // Check if clicking on existing text for editing
      const existingText = checkTextClick(pos);
      if (existingText) {
        openTextModal({ x: existingText.x, y: existingText.y }, existingText);
      } else {
        openTextModal(pos);
      }
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
        width: strokeWidth,
        hasFill: hasFill,
        fillColor: fillColor
      });
      setIsDrawing(true);
      return;
    }

    if (tool === 'pen' || tool === 'eraser') {
      const newPath = {
        points: [{ x: pos.x, y: pos.y }],
        color: strokeColor,
        width: tool === 'eraser' ? strokeWidth * 3 : strokeWidth,
        operation: tool === 'eraser' ? 'destination-out' : 'source-over'
      };
      
      setDrawPaths(prev => [...prev, newPath]);
      setIsDrawing(true);
    }
  };

  const draw = (e) => {
    e.preventDefault();
    const pos = getMousePos(e);

    // Handle middle mouse button panning
    if (isMiddleMousePanning || isPanning) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      setPan(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      redrawCanvas();
      return;
    }

    // Don't draw if middle mouse panning
    if (isMiddleMousePanning) return;

    if (!isDrawing) return;

    if (shapeTools.some(s => s.name === tool)) {
      if (!currentShape) return;
      
      redrawCanvas();
      
      const context = contextRef.current;
      context.save();
      context.translate(pan.x, pan.y);
      
      const w = pos.x - currentShape.startX;
      const h = pos.y - currentShape.startY;
      
      context.beginPath();
      context.strokeStyle = strokeColor;
      context.lineWidth = strokeWidth;
      context.globalCompositeOperation = 'source-over';
      
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
      
      const context = contextRef.current;
      const currentPath = drawPaths[drawPaths.length - 1];
      if (currentPath && currentPath.points.length > 1) {
        context.save();
        context.translate(pan.x, pan.y);
        context.strokeStyle = currentPath.color;
        context.lineWidth = currentPath.width;
        context.globalCompositeOperation = currentPath.operation;
        
        const points = currentPath.points;
        const lastPoint = points[points.length - 2];
        context.beginPath();
        context.moveTo(lastPoint.x, lastPoint.y);
        context.lineTo(pos.x, pos.y);
        context.stroke();
        context.restore();
      }
    }
  };

  const stopDrawing = (e) => {
    // Handle middle mouse button release
    if (e.button === 1 && isMiddleMousePanning) {
      setIsMiddleMousePanning(false);
      return;
    }

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
        
        if (Math.abs(w) > 5 || Math.abs(h) > 5) {
          const newShape = {
            ...currentShape,
            w,
            h
          };
          setShapes(prev => [...prev, newShape]);
        }
        setCurrentShape(null);
      }
    }

    setIsDrawing(false);
  };

  const clearCanvas = () => {
    setShapes([]);
    setTextElements([]);
    setDrawPaths([]);
    const context = contextRef.current;
    const canvas = canvasRef.current;
    if (context && canvas) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const exportCanvas = document.createElement('canvas');
    const exportContext = exportCanvas.getContext('2d');
    
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    
    exportContext.fillStyle = 'white';
    exportContext.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    exportContext.drawImage(canvas, 0, 0);

    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  };

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', 
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500',
    '#800080', '#FFC0CB', '#A52A2A', '#808080'
  ];

  return (
    <StyledWrapper className="bg-slate-100 dark:bg-slate-900">
      {/* Header */}
      <div className="header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        
        {/* Floating Tools Button */}
        <button 
          className="tools-toggle"
          onClick={() => setToolsPanelOpen(!toolsPanelOpen)}
        >
          <Settings size={20} />
          <span>Tools</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Floating Tools Panel */}
        {toolsPanelOpen && (
          <div className="floating-panel">
            <div className="panel-header">
              <h3>Tools</h3>
              <button 
                className="close-btn"
                onClick={() => setToolsPanelOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="panel-content">
              <div className="panel-section">
                <div className="tools-grid">
                  {basicTools.map(({ name, icon: Icon, label }) => (
                    <button 
                      key={name}
                      className={`tool-btn ${tool === name ? 'active' : ''}`} 
                      onClick={() => setTool(name)}
                      title={label}
                    >
                      <Icon size={14} />
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
                  <span>Shapes</span>
                  {shapesExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
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
                        <Icon size={14} />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="panel-section">
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
                </div>
              </div>

              <div className="panel-section">
                <div className="fill-controls">
                  <label className="fill-header">
                    <input
                      type="checkbox"
                      checked={hasFill}
                      onChange={(e) => setHasFill(e.target.checked)}
                      className="fill-checkbox"
                    />
                    Fill Shapes
                  </label>
                  {hasFill && (
                    <div className="fill-color-grid">
                      {colors.map(color => (
                        <button
                          key={color}
                          className={`fill-color-btn ${fillColor === color ? 'active' : ''}`}
                          style={{ backgroundColor: color }}
                          onClick={() => setFillColor(color)}
                          title={`Fill with ${color}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="panel-section">
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
                <div className="actions-grid">
                  <button className="action-btn" onClick={downloadCanvas}>
                    <Download size={14} />
                    <span>Download</span>
                  </button>
                  <button className="action-btn danger" onClick={clearCanvas}>
                    <Trash2 size={14} />
                    <span>Clear</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Canvas Area */}
        <div className="canvas-container" ref={containerRef}>
          <div className="grid-background" />
          <canvas
            ref={canvasRef}
            className={`whiteboard-canvas ${tool === 'pan' || isMiddleMousePanning ? 'pan-cursor' : ''}`}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onContextMenu={(e) => e.preventDefault()}
            onWheel={(e) => {
              // Prevent page scrolling when over canvas
              e.preventDefault();
            }}
          />
        </div>
      </div>

      {/* Text Modal */}
      {textModal && (
        <div className="text-modal-overlay">
          <div className="text-modal">
            <div className="text-modal-header">
              <h3>{editingTextId ? 'Edit Text' : 'Add Text'}</h3>
              <button onClick={() => setTextModal(null)} className="close-btn">
                <X size={16} />
              </button>
            </div>
            
            <div className="text-modal-content">
              <div className="text-input-section">
                <label className="input-label">Text Content</label>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type your text here..."
                  className="text-input"
                  rows={4}
                  autoFocus
                />
              </div>

              <div className="preview-section">
                <label className="input-label">Preview</label>
                <div
                  className="text-preview"
                  style={{
                    fontFamily: fontFamily,
                    fontSize: `${fontSize}px`,
                    fontWeight: isBold ? 'bold' : 'normal',
                    fontStyle: isItalic ? 'italic' : 'normal',
                    textAlign: textAlign,
                    color: strokeColor
                  }}
                >
                  {textInput || 'Preview text...'}
                </div>
              </div>

              <div className="formatting-section">
                <div className="format-row">
                  <label>Font Family:</label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="font-select"
                  >
                    {fontFamilies.map(font => (
                      <option key={font} value={font} style={{ fontFamily: font }}>
                        {font}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="format-row">
                  <label>Font Size:</label>
                  <div className="size-controls">
                    <button
                      onClick={() => setFontSize(Math.max(8, fontSize - 2))}
                      className="size-btn"
                      disabled={fontSize <= 8}
                    >
                      <Minus size={12} />
                    </button>
                    <input
                      type="number"
                      value={fontSize}
                      onChange={(e) => setFontSize(Math.max(8, Math.min(144, parseInt(e.target.value) || 16)))}
                      className="size-input"
                      min="8"
                      max="144"
                    />
                    <span className="size-unit">px</span>
                    <button
                      onClick={() => setFontSize(Math.min(144, fontSize + 2))}
                      className="size-btn"
                      disabled={fontSize >= 144}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>

                <div className="format-row">
                  <label>Text Style:</label>
                  <div className="style-controls">
                    <button
                      className={`style-btn ${isBold ? 'active' : ''}`}
                      onClick={() => setIsBold(!isBold)}
                      title="Bold"
                    >
                      <Bold size={14} />
                    </button>
                    <button
                      className={`style-btn ${isItalic ? 'active' : ''}`}
                      onClick={() => setIsItalic(!isItalic)}
                      title="Italic"
                    >
                      <Italic size={14} />
                    </button>
                  </div>
                </div>

                <div className="format-row">
                  <label>Alignment:</label>
                  <div className="align-controls">
                    <button
                      className={`align-btn ${textAlign === 'left' ? 'active' : ''}`}
                      onClick={() => setTextAlign('left')}
                      title="Align Left"
                    >
                      <AlignLeft size={14} />
                    </button>
                    <button
                      className={`align-btn ${textAlign === 'center' ? 'active' : ''}`}
                      onClick={() => setTextAlign('center')}
                      title="Align Center"
                    >
                      <AlignCenter size={14} />
                    </button>
                    <button
                      className={`align-btn ${textAlign === 'right' ? 'active' : ''}`}
                      onClick={() => setTextAlign('right')}
                      title="Align Right"
                    >
                      <AlignRight size={14} />
                    </button>
                  </div>
                </div>

                <div className="format-row">
                  <label>Color:</label>
                  <div className="color-selector">
                    <div
                      className="current-color"
                      style={{ backgroundColor: strokeColor }}
                      title="Current text color"
                    ></div>
                    <div className="color-options">
                      {colors.slice(0, 8).map(color => (
                        <button
                          key={color}
                          className={`color-option ${strokeColor === color ? 'active' : ''}`}
                          style={{ backgroundColor: color }}
                          onClick={() => setStrokeColor(color)}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-modal-actions">
                <button onClick={() => setTextModal(null)} className="cancel-btn">
                  Cancel
                </button>
                {editingTextId && (
                  <button
                    onClick={() => {
                      setTextElements(prev => prev.filter(text => text.id !== editingTextId));
                      setTextModal(null);
                      setEditingTextId(null);
                      setTimeout(() => redrawCanvas(), 0);
                    }}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                )}
                <button onClick={addTextElement} className="add-btn">
                  {editingTextId ? 'Update Text' : 'Add Text'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
    position: relative;
    height: calc(100vh - 60px);
  }

  .back-btn, .tools-toggle {
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

  .floating-panel {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 320px;
    background: rgba(255, 255, 255, 0.98);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(24px);
    z-index: 20;
    animation: slideInRight 0.3s ease-out;

    .dark & {
      background: rgba(15, 23, 42, 0.98);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
  }

  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    
    .dark & {
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    h3 {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      margin: 0;
      
      .dark & {
        color: #d1d5db;
      }
    }
  }

  .close-btn {
    padding: 0.25rem;
    background: none;
    border: none;
    border-radius: 0.25rem;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s;
    
    .dark & {
      color: #9ca3af;
    }
    
    &:hover {
      background: rgba(0, 0, 0, 0.05);
      color: #374151;
      
      .dark & {
        background: rgba(255, 255, 255, 0.05);
        color: #d1d5db;
      }
    }
  }

  .panel-content {
    padding: 1rem;
    max-height: 500px;
    overflow-y: auto;
  }

  .panel-section {
    margin-bottom: 1rem;
    
    &:last-child {
      margin-bottom: 0;
    }
  }

  .shapes-header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: none;
    border: none;
    padding: 0.5rem;
    cursor: pointer;
    color: #374151;
    border-radius: 0.25rem;
    transition: all 0.2s;
    font-size: 0.75rem;
    font-weight: 600;
    
    .dark & {
      color: #d1d5db;
    }
    
    &:hover {
      background: rgba(0, 0, 0, 0.05);
      color: #2563eb;
      
      .dark & {
        background: rgba(255, 255, 255, 0.05);
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
    padding: 0.6rem 0.4rem;
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
    gap: 0.5rem;
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
    height: 3px;
    border-radius: 2px;
    background: rgba(0, 0, 0, 0.1);
    outline: none;
    cursor: pointer;
    appearance: none;
    
    .dark & {
      background: rgba(255, 255, 255, 0.1);
    }
    
    &::-webkit-slider-thumb {
      appearance: none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #2563eb;
      cursor: pointer;
      
      .dark & {
        background: #60a5fa;
      }
    }
    
    &::-moz-range-thumb {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #2563eb;
      cursor: pointer;
      border: none;
      
      .dark & {
        background: #60a5fa;
      }
    }
  }

  .color-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
  }

  .fill-controls {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .fill-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: #374151;
    cursor: pointer;

    .dark & {
      color: #d1d5db;
    }
  }

  .fill-checkbox {
    width: 16px;
    height: 16px;
    border-radius: 0.25rem;
    border: 2px solid rgba(0, 0, 0, 0.2);
    cursor: pointer;

    .dark & {
      border: 2px solid rgba(255, 255, 255, 0.2);
    }

    &:checked {
      background: #2563eb;
      border-color: #2563eb;

      .dark & {
        background: #60a5fa;
        border-color: #60a5fa;
      }
    }
  }

  .fill-color-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
    animation: slideDown 0.2s ease-out;
  }

  .fill-color-btn {
    width: 28px;
    height: 28px;
    border: 2px solid transparent;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;

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

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .color-btn {
    width: 28px;
    height: 28px;
    border: 2px solid transparent;
    border-radius: 0.375rem;
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
    padding: 0.6rem;
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
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
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
    user-select: none;

    &.pan-cursor {
      cursor: grab;

      &:active {
        cursor: grabbing;
      }
    }

    /* Show grabbing cursor when middle mouse panning */
    &:active:not(.pan-cursor) {
      cursor: grabbing;
    }
  }

  /* Text Modal Styles */
  .text-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    backdrop-filter: blur(8px);
    animation: fadeIn 0.2s ease-out;
  }

  .text-modal {
    background: white;
    border-radius: 16px;
    width: 500px;
    max-width: 90vw;
    max-height: 80vh;
    box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3);
    animation: slideInScale 0.3s ease-out;
    overflow: hidden;

    .dark & {
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideInScale {
    from {
      transform: scale(0.9) translateY(-20px);
      opacity: 0;
    }
    to {
      transform: scale(1) translateY(0);
      opacity: 1;
    }
  }

  .text-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    
    .dark & {
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    h3 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #374151;
      
      .dark & {
        color: #d1d5db;
      }
    }
  }

  .text-modal-content {
    padding: 1.5rem;
  }

  .text-input-section {
    margin-bottom: 1.5rem;
  }

  .input-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;

    .dark & {
      color: #d1d5db;
    }
  }

  .text-input {
    width: 100%;
    padding: 1rem;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-radius: 0.75rem;
    font-size: 0.875rem;
    resize: vertical;
    min-height: 100px;
    transition: all 0.2s ease;
    font-family: inherit;

    .dark & {
      background: #334155;
      border: 2px solid rgba(255, 255, 255, 0.1);
      color: #d1d5db;
    }

    &:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
      transform: translateY(-1px);
    }
  }

  .preview-section {
    margin-bottom: 1.5rem;
  }

  .text-preview {
    width: 100%;
    min-height: 60px;
    padding: 1rem;
    border: 2px dashed rgba(0, 0, 0, 0.1);
    border-radius: 0.75rem;
    background: rgba(0, 0, 0, 0.02);
    display: flex;
    align-items: center;
    justify-content: center;
    word-wrap: break-word;
    white-space: pre-wrap;

    .dark & {
      background: rgba(255, 255, 255, 0.02);
      border: 2px dashed rgba(255, 255, 255, 0.1);
    }
  }

  .formatting-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .format-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    
    label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #374151;
      min-width: 50px;
      
      .dark & {
        color: #d1d5db;
      }
    }
  }

  .font-select {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 0.375rem;
    font-size: 0.75rem;
    
    .dark & {
      background: #334155;
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #d1d5db;
    }
  }

  .size-controls, .style-controls, .align-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .size-btn, .style-btn, .align-btn {
    padding: 0.5rem;
    background: rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;

    .dark & {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #d1d5db;
    }

    &:hover, &.active {
      background: rgba(59, 130, 246, 0.1);
      border-color: rgba(59, 130, 246, 0.3);
      color: #2563eb;
      transform: translateY(-1px);

      .dark & {
        color: #60a5fa;
      }
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;

      &:hover {
        background: rgba(0, 0, 0, 0.05);
        border-color: rgba(0, 0, 0, 0.1);
        color: inherit;

        .dark & {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
        }
      }
    }
  }

  .size-input {
    width: 60px;
    padding: 0.5rem;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 0.375rem;
    text-align: center;
    font-size: 0.75rem;
    font-weight: 500;

    .dark & {
      background: #334155;
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #d1d5db;
    }

    &:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
    }
  }

  .size-unit {
    font-size: 0.75rem;
    color: #6b7280;
    font-weight: 500;

    .dark & {
      color: #9ca3af;
    }
  }

  .color-selector {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .current-color {
    width: 32px;
    height: 32px;
    border-radius: 0.5rem;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    cursor: pointer;

    .dark & {
      border-color: #334155;
    }
  }

  .color-options {
    display: flex;
    gap: 0.375rem;
  }

  .color-option {
    width: 24px;
    height: 24px;
    border-radius: 0.375rem;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s;

    &.active {
      border-color: #2563eb;
      transform: scale(1.1);
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);

      .dark & {
        border-color: #60a5fa;
        box-shadow: 0 2px 8px rgba(96, 165, 250, 0.3);
      }
    }

    &:hover {
      transform: scale(1.1);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
  }

  .text-modal-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
  }

  .cancel-btn, .add-btn {
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .cancel-btn {
    background: none;
    border: 1px solid rgba(0, 0, 0, 0.2);
    color: #6b7280;
    
    .dark & {
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #9ca3af;
    }
    
    &:hover {
      background: rgba(0, 0, 0, 0.05);
      
      .dark & {
        background: rgba(255, 255, 255, 0.05);
      }
    }
  }

  .add-btn {
    background: #2563eb;
    border: 1px solid #2563eb;
    color: white;
    
    &:hover {
      background: #1d4ed8;
      border-color: #1d4ed8;
    }
  }

  @media (max-width: 768px) {
    .header {
      padding: 0.75rem;
    }

    .floating-panel {
      top: 10px;
      right: 10px;
      left: 10px;
      width: calc(100vw - 20px);
      max-width: none;
      animation: slideInTop 0.3s ease-out;
    }

    @keyframes slideInTop {
      from {
        transform: translateY(-100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    
    .text-modal {
      width: calc(100vw - 40px);
      max-width: 350px;
    }
    
    .tools-grid, .shapes-grid {
      grid-template-columns: repeat(4, 1fr);
      gap: 0.375rem;
    }
    
    .tool-btn {
      padding: 0.5rem 0.25rem;
      font-size: 0.5rem;
      
      span {
        display: none;
      }
    }
    
    .color-grid {
      grid-template-columns: repeat(6, 1fr);
      gap: 0.375rem;
    }
    
    .color-btn {
      width: 24px;
      height: 24px;
    }
  }
`;

export default WhiteboardPage;
