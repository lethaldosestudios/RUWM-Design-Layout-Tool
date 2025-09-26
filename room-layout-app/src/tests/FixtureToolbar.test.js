import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import FixtureToolbar from '../components/FixtureToolbar';

// Mocking the fetch call to fixtures.yml
const mockFixtures = [
    { id: 1, name: 'Toilet', width: 50, height: 50, clearance: [] },
    { id: 2, name: 'Sink', width: 60, height: 40, clearance: [] },
];

beforeEach(() => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
        text: () => Promise.resolve(JSON.stringify(mockFixtures)),
    });
});

afterEach(() => {
    global.fetch.mockRestore();
});

describe('FixtureToolbar', () => {
    it('fetches and renders fixtures', async () => {
        render(<FixtureToolbar />);

        // Wait for the fixtures to be loaded and rendered
        await waitFor(() => {
            expect(screen.getByText('Toilet')).toBeInTheDocument();
            expect(screen.getByText('Sink')).toBeInTheDocument();
        });
    });
});