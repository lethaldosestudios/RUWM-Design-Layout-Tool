import React, { useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import jsPDF from 'jspdf';
import Canvas from './Canvas';
import FixtureToolbar from './FixtureToolbar';

const Main = () => {
  const [roomWidth, setRoomWidth] = useState(400);
  const [roomHeight, setRoomHeight] = useState(300);
  const [placedFixtures, setPlacedFixtures] = useState([]);
  const canvasRef = useRef(null);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const gridSize = 20;
  const fileInputRef = useRef(null);

  const addFixture = (fixture, x, y) => {
    const newFixture = {
      ...fixture,
      id: uuidv4(),
      x,
      y,
      rotation: 0,
    };
    setPlacedFixtures([...placedFixtures, newFixture]);
  };

  const updateFixture = (id, newAttrs) => {
    const newFixtures = placedFixtures.map((fixture) => {
      if (fixture.id === id) {
        return { ...fixture, ...newAttrs };
      }
      return fixture;
    });
    setPlacedFixtures(newFixtures);
  };

  const handleExportPNG = () => {
    const uri = canvasRef.current.getStage().toDataURL();
    const link = document.createElement('a');
    link.download = 'layout.png';
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const uri = canvasRef.current.getStage().toDataURL();
    const pdf = new jsPDF();
    pdf.addImage(uri, 'PNG', 0, 0, roomWidth / 4, roomHeight / 4);
    pdf.save('layout.pdf');
  };

  const handleExportSVG = async () => {
    const svg = await canvasRef.current.getStage().toSVG();
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'layout.svg';
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSave = () => {
    const layout = {
        roomWidth,
        roomHeight,
        placedFixtures,
    };
    const blob = new Blob([JSON.stringify(layout, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'layout.json';
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLoad = (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const layout = JSON.parse(e.target.result);
                setRoomWidth(layout.roomWidth);
                setRoomHeight(layout.roomHeight);
                setPlacedFixtures(layout.placedFixtures);
            } catch (error) {
                console.error("Error parsing layout file:", error);
                alert("Invalid layout file.");
            }
        };
        reader.readAsText(file);
    }
  };

  const handleLoadClick = () => {
    fileInputRef.current.click();
  }

  return (
    <div className="App">
      <h1>Room Layout Blueprint App</h1>
      <div className="main-container">
        <div className="controls-container">
            <div className="control-group">
                <h3>Room Dimensions</h3>
                <label>
                Width:
                <input
                    type="number"
                    value={roomWidth}
                    onChange={(e) => setRoomWidth(parseInt(e.target.value, 10))}
                />
                </label>
                <label>
                Height:
                <input
                    type="number"
                    value={roomHeight}
                    onChange={(e) => setRoomHeight(parseInt(e.target.value, 10))}
                />
                </label>
            </div>
            <div className="control-group">
                <h3>Grid Settings</h3>
                <label>
                <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                />
                Show Grid
                </label>
                <label>
                <input
                    type="checkbox"
                    checked={snapToGrid}
                    onChange={(e) => setSnapToGrid(e.target.checked)}
                />
                Snap to Grid
                </label>
            </div>
            <div className="control-group">
                <h3>Actions</h3>
                <div className="button-group">
                    <button onClick={handleSave}>Save</button>
                    <button onClick={handleLoadClick}>Load</button>
                    <input type="file" ref={fileInputRef} onChange={handleLoad} style={{ display: 'none' }} accept=".json" />
                    <button onClick={handleExportPNG}>PNG</button>
                    <button onClick={handleExportSVG}>SVG</button>
                    <button onClick={handleExportPDF}>PDF</button>
                </div>
            </div>
        </div>
        <Canvas
          ref={canvasRef}
          width={roomWidth}
          height={roomHeight}
          fixtures={placedFixtures}
          onDrop={addFixture}
          onUpdateFixture={updateFixture}
          showGrid={showGrid}
          snapToGrid={snapToGrid}
          gridSize={gridSize}
        />
        <FixtureToolbar />
      </div>
    </div>
  );
};

export default Main;