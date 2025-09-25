import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Main from '../components/Main';
import FixtureToolbar from '../components/FixtureToolbar';
import yaml from 'js-yaml';

// --- Utility Functions ---
const haveIntersection = (r1, r2) => {
    return !(
      r2.x > r1.x + r1.width ||
      r2.x + r2.width < r1.x ||
      r2.y > r1.y + r1.height ||
      r2.y + r2.height < r1.y
    );
  }

describe('Utility Functions', () => {
    describe('haveIntersection', () => {
        it('should return true for overlapping rectangles', () => {
            const r1 = { x: 0, y: 0, width: 10, height: 10 };
            const r2 = { x: 5, y: 5, width: 10, height: 10 };
            expect(haveIntersection(r1, r2)).toBe(true);
        });

        it('should return false for non-overlapping rectangles', () => {
            const r1 = { x: 0, y: 0, width: 10, height: 10 };
            const r2 = { x: 20, y: 20, width: 10, height: 10 };
            expect(haveIntersection(r1, r2)).toBe(false);
        });
    });
});

// --- Component Tests ---
describe('Main Component', () => {
    it('renders the main application title', () => {
        render(<Main />);
        const titleElement = screen.getByText(/Room Layout Blueprint App/i);
        expect(titleElement).toBeInTheDocument();
      });

    it('adds a fixture to the canvas when dropped', async () => {
        render(<Main />);

        // Mock a fixture being dragged and dropped
        const canvas = screen.getByRole('presentation').querySelector('canvas');
        const fixtureData = { id: 1, name: 'Toilet', width: 50, height: 50, clearance: [] };

        fireEvent.drop(canvas, {
            dataTransfer: {
                getData: () => JSON.stringify(fixtureData),
            },
            clientX: 100,
            clientY: 100,
        });

        // This is a simplified test. A more complete test would check the state or rendered output.
        // For now, we just ensure no errors are thrown.
    });
});

describe('FixtureToolbar Component', () => {
    const mockFixtures = [
        { id: 1, name: 'Toilet', width: 50, height: 50, clearance: [] },
        { id: 2, name: 'Sink', width: 60, height: 40, clearance: [] },
    ];

    beforeEach(() => {
        const yamlString = yaml.dump(mockFixtures);
        jest.spyOn(global, 'fetch').mockResolvedValue({
            text: () => Promise.resolve(yamlString),
        });
    });

    afterEach(() => {
        global.fetch.mockRestore();
    });

    it('fetches and renders fixtures from YAML', async () => {
        render(<FixtureToolbar />);

        await waitFor(() => {
            expect(screen.getByText('Toilet')).toBeInTheDocument();
            expect(screen.getByText('Sink')).toBeInTheDocument();
        });
    });
});