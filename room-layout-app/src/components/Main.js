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

  return (
    <div>
      <h1>Room Layout Blueprint App</h1>
      <div style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ccc' }}>
        <h2>Instructions</h2>
        <ul>
          <li>Enter the dimensions of your room in the input fields.</li>
          <li>Drag and drop fixtures from the toolbar on the right onto the canvas.</li>
          <li>Click on a fixture to select it. You can then move, rotate, and resize it.</li>
          <li>When a fixture is selected, its clearance zones will be displayed. Green means the placement is compliant, red means there is a violation.</li>
          <li>Use the export buttons to save your layout as a PNG, SVG, or PDF file.</li>
        </ul>
      </div>
      <div>
        <label>
          Room Width:
          <input
            type="number"
            value={roomWidth}
            onChange={(e) => setRoomWidth(parseInt(e.target.value, 10))}
          />
        </label>
        <label>
          Room Height:
          <input
            type="number"
            value={roomHeight}
            onChange={(e) => setRoomHeight(parseInt(e.target.value, 10))}
          />
        </label>
      </div>
      <div>
        <button onClick={handleExportPNG}>Export as PNG</button>
        <button onClick={handleExportSVG}>Export as SVG</button>
        <button onClick={handleExportPDF}>Export as PDF</button>
      </div>
      <div style={{ display: 'flex' }}>
        <Canvas
          ref={canvasRef}
          width={roomWidth}
          height={roomHeight}
          fixtures={placedFixtures}
          onDrop={addFixture}
          onUpdateFixture={updateFixture}
        />
        <FixtureToolbar />
      </div>
    </div>
  );
};

export default Main;
