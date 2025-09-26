import React, { useEffect, useState } from 'react';
import yaml from 'js-yaml';

const FixtureToolbar = () => {
  const [fixtures, setFixtures] = useState([]);

  useEffect(() => {
    fetch('/fixtures.yml')
      .then((response) => response.text())
      .then((text) => {
        try {
            const data = yaml.load(text);
            setFixtures(data);
        } catch (e) {
            console.error("Error parsing fixtures.yml:", e);
        }
      });
  }, []);

  return (
    <div className="fixture-toolbar">
      <h2>Fixtures</h2>
      {fixtures.map((fixture) => (
        <div
          key={fixture.id}
          className="fixture-item"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify(fixture));
          }}
        >
          {fixture.name}
        </div>
      ))}
    </div>
  );
};

export default FixtureToolbar;