import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Stage, Layer, Rect, Transformer, Group, Line, Arc } from 'react-konva';
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
    const clearanceRules = fixture.clearance;
    if (!clearanceRules || clearanceRules.length === 0) return null;

    const getClearanceShapes = () => {
      const shapes = [];

      clearanceRules.forEach((rule, index) => {
        let configs = [];

        switch (rule.type) {
          case 'front':
            configs.push({ x: 0, y: -rule.distance, width: fixture.width, height: rule.distance });
            break;
          case 'side':
            configs.push({ x: -rule.distance, y: 0, width: rule.distance, height: fixture.height });
            configs.push({ x: fixture.width, y: 0, width: rule.distance, height: fixture.height });
            break;
          case 'swing':
            configs.push({ x: 0, y: 0, innerRadius: 0, outerRadius: rule.distance, angle: 90, shape: 'arc' });
            break;
          default:
            return;
        }

        configs.forEach((config, i) => {
            const zoneShape = config.shape === 'arc' ? new Konva.Arc(config) : new Konva.Rect(config);

            const group = new Konva.Group({
                x: fixture.x,
                y: fixture.y,
                rotation: fixture.rotation,
            });
            group.add(zoneShape);
            const worldRect = group.getClientRect();

            const isViolating = allFixtures.some(f => {
                if (f.id === fixture.id) return false;
                const otherFixtureNode = new Konva.Rect(f);
                const otherFixtureBox = otherFixtureNode.getClientRect();
                return haveIntersection(worldRect, otherFixtureBox);
            });

            shapes.push({
                key: `${fixture.id}-clearance-${index}-${i}`,
                shape: config.shape || 'rect',
                config,
                fill: isViolating ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 255, 0, 0.3)',
            });
        });
      });

      return shapes;
    };

    return (
      <Group x={fixture.x} y={fixture.y} rotation={fixture.rotation}>
        {getClearanceShapes().map(shapeInfo => {
          if (shapeInfo.shape === 'rect') {
            return <Rect key={shapeInfo.key} {...shapeInfo.config} fill={shapeInfo.fill} />;
          }
          if (shapeInfo.shape === 'arc') {
            return <Arc key={shapeInfo.key} {...shapeInfo.config} fill={shapeInfo.fill} />;
          }
          return null;
        })}
      </Group>
    );
  };

/**
 * Renders a single fixture on the canvas.
 * It can be selected, moved, rotated, and resized.
 * When selected, it also renders its clearance zones.
 */
const FixtureComponent = ({ shapeProps, isSelected, onSelect, onChange, allFixtures, snapToGrid, gridSize }) => {
  const shapeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  const handleDragEnd = (e) => {
    let newX = e.target.x();
    let newY = e.target.y();
    if (snapToGrid) {
        newX = Math.round(newX / gridSize) * gridSize;
        newY = Math.round(newY / gridSize) * gridSize;
    }
    onChange({ ...shapeProps, x: newX, y: newY });
  };

  return (
    <Group>
        {isSelected && <ClearanceZone fixture={shapeProps} allFixtures={allFixtures} />}
        <Rect
            onClick={onSelect}
            onTap={onSelect}
            ref={shapeRef}
            {...shapeProps}
            draggable
            onDragEnd={handleDragEnd}
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

const GridLayer = ({ width, height, gridSize }) => {
    const lines = [];
    // Draw vertical lines
    for (let i = 0; i < width / gridSize; i++) {
      lines.push(
        <Line
          key={`v-${i}`}
          points={[Math.round(i * gridSize) + 0.5, 0, Math.round(i * gridSize) + 0.5, height]}
          stroke="#ddd"
          strokeWidth={1}
        />
      );
    }
    // Draw horizontal lines
    for (let j = 0; j < height / gridSize; j++) {
      lines.push(
        <Line
          key={`h-${j}`}
          points={[0, Math.round(j * gridSize), width, Math.round(j * gridSize)]}
          stroke="#ddd"
          strokeWidth={1}
        />
      );
    }
    return <Layer>{lines}</Layer>;
  };

/**
 * The main canvas component where the room layout is drawn.
 * It handles drag and drop of fixtures, selection, and rendering of all elements.
 */
const Canvas = forwardRef(({ width, height, fixtures, onDrop, onUpdateFixture, showGrid, snapToGrid, gridSize }, ref) => {
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
      let fixture = JSON.parse(e.dataTransfer.getData('text/plain'));
      let { x, y } = stageRef.current.getPointerPosition();

      if (snapToGrid) {
          x = Math.round(x / gridSize) * gridSize;
          y = Math.round(y / gridSize) * gridSize;
      }

      onDrop(fixture, x, y);
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
          {showGrid && <GridLayer width={width} height={height} gridSize={gridSize} />}
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
                snapToGrid={snapToGrid}
                gridSize={gridSize}
              />
            ))}
          </Layer>
        </Stage>
      </div>
    );
  });

export default Canvas;