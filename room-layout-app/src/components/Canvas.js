import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Stage, Layer, Rect, Transformer, Group } from 'react-konva';
import Konva from 'konva';

/**
 * A simple AABB intersection check.
 * @param {Object} r1 - The first rectangle with x, y, width, height.
 * @param {Object} r2 - The second rectangle.
 * @returns {boolean} - True if the rectangles intersect.
 */
const haveIntersection = (r1, r2) => {
    return !(
      r2.x > r1.x + r1.width ||
      r2.x + r2.width < r1.x ||
      r2.y > r1.y + r1.height ||
      r2.y + r2.height < r1.y
    );
  }

/**
 * Renders the clearance zones for a given fixture.
 * The zones are color-coded based on whether they intersect with other fixtures.
 */
const ClearanceZone = ({ fixture, allFixtures }) => {
    const clearance = fixture.clearance;
    if (!clearance) return null;

    /**
     * Calculates the clearance zones and checks for collisions.
     * @returns {Array} - An array of shape properties for the clearance zones.
     */
    const getClearanceShapes = () => {
      const shapes = [];
      const addZone = (key, config) => {
        // Create a temporary group to calculate the world position of the clearance zone.
        const group = new Konva.Group({
            x: fixture.x,
            y: fixture.y,
            rotation: fixture.rotation,
        });
        group.add(new Konva.Rect(config));
        const worldRect = group.getClientRect();

        // Check for intersection with all other fixtures.
        const isViolating = allFixtures.some(f => {
            if (f.id === fixture.id) return false;
            const otherFixtureNode = new Konva.Rect(f);
            const otherFixtureBox = otherFixtureNode.getClientRect();
            return haveIntersection(worldRect, otherFixtureBox);
        });

        shapes.push({
            ...config,
            key,
            fill: isViolating ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 255, 0, 0.3)',
        });
      };

      // Add clearance zones based on the fixture's configuration.
      if (clearance.front) {
        addZone('front', { x: -clearance.front, y: 0, width: fixture.width + clearance.front * 2, height: fixture.height });
      }
      if (clearance.sides) {
        addZone('sides', { x: -clearance.sides, y: 0, width: fixture.width + clearance.sides * 2, height: fixture.height });
      }
      if (clearance.back) {
        addZone('back', { x: 0, y: fixture.height, width: fixture.width, height: clearance.back });
      }

      return shapes;
    };

    // The clearance zones are rendered in a group that is transformed with the fixture.
    return (
      <Group x={fixture.x} y={fixture.y} rotation={fixture.rotation} >
        {getClearanceShapes().map(shape => <Rect {...shape} />)}
      </Group>
    );
  };

/**
 * Renders a single fixture on the canvas.
 * It can be selected, moved, rotated, and resized.
 * When selected, it also renders its clearance zones.
 */
const FixtureComponent = ({ shapeProps, isSelected, onSelect, onChange, allFixtures }) => {
  const shapeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <Group>
        {isSelected && <ClearanceZone fixture={shapeProps} allFixtures={allFixtures} />}
        <Rect
            onClick={onSelect}
            onTap={onSelect}
            ref={shapeRef}
            {...shapeProps}
            draggable
            onDragEnd={(e) => {
            onChange({ ...shapeProps, x: e.target.x(), y: e.target.y() });
            }}
            onTransformEnd={(e) => {
            const node = shapeRef.current;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            node.scaleX(1);
            node.scaleY(1);
            onChange({
                ...shapeProps,
                x: node.x(),
                y: node.y(),
                width: Math.max(5, node.width() * scaleX),
                height: Math.max(node.height() * scaleY),
                rotation: node.rotation(),
            });
            }}
        />
        {isSelected && (
            <Transformer
            ref={trRef}
            boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) {
                return oldBox;
                }
                return newBox;
            }}
            />
        )}
    </Group>
  );
};

/**
 * The main canvas component where the room layout is drawn.
 * It handles drag and drop of fixtures, selection, and rendering of all elements.
 */
const Canvas = forwardRef(({ width, height, fixtures, onDrop, onUpdateFixture }, ref) => {
    const [selectedId, selectShape] = useState(null);
    const stageRef = useRef();

    // Expose the stage instance to the parent component via a ref.
    useImperativeHandle(ref, () => ({
      getStage: () => stageRef.current,
    }));

    const checkDeselect = (e) => {
      const clickedOnEmpty = e.target === e.target.getStage();
      if (clickedOnEmpty) {
        selectShape(null);
      }
    };

    const handleDrop = (e) => {
      e.preventDefault();
      stageRef.current.setPointersPositions(e);
      const fixture = JSON.parse(e.dataTransfer.getData('text/plain'));
      onDrop(fixture, stageRef.current.getPointerPosition().x, stageRef.current.getPointerPosition().y);
    };

    return (
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <Stage
          ref={stageRef}
          width={width}
          height={height}
          style={{ border: '1px solid black' }}
          onMouseDown={checkDeselect}
          onTouchStart={checkDeselect}
        >
          <Layer>
            <Rect x={0} y={0} width={width} height={height} fill="white" />
            {fixtures.map((fixture) => (
              <FixtureComponent
                key={fixture.id}
                shapeProps={fixture}
                isSelected={fixture.id === selectedId}
                onSelect={() => {
                  selectShape(fixture.id);
                }}
                onChange={(newAttrs) => {
                  onUpdateFixture(fixture.id, newAttrs);
                }}
                allFixtures={fixtures}
              />
            ))}
          </Layer>
        </Stage>
      </div>
    );
  });

export default Canvas;
