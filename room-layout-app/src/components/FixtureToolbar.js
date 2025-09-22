import React, { useEffect, useState } from 'react';
import yaml from 'js-yaml';

const FixtureToolbar = ({ onAddFixture }) => {
  const [fixtures, setFixtures] = useState([]);

  useEffect(() => {
    fetch('/fixtures.yml')
      .then((response) => response.text())
      .then((text) => {
        const data = yaml.load(text);
        setFixtures(data);
      });
  }, []);

  return (
    <div style={{ border: '1px solid black', padding: '10px' }}>
      <h2>Fixture Toolbar</h2>
      {fixtures.map((fixture) => (
        <div
          key={fixture.id}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify(fixture));
          }}
          style={{ cursor: 'grab', padding: '5px', border: '1px solid grey', margin: '5px 0' }}
        >
          {fixture.name}
        </div>
      ))}
    </div>
  );
};

export default FixtureToolbar;
