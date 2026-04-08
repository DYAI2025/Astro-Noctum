import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PlanetariumProvider, usePlanetarium } from '../contexts/PlanetariumContext';

function TestConsumer() {
  const { skyMode, setSkyMode, planetariumMode } = usePlanetarium();
  return (
    <div>
      <span data-testid="sky-mode">{skyMode}</span>
      <span data-testid="planetarium">{String(planetariumMode)}</span>
      <button onClick={() => setSkyMode('current')}>current</button>
      <button onClick={() => setSkyMode('birth')}>birth</button>
    </div>
  );
}

describe('PlanetariumContext skyMode', () => {
  it('defaults to birth', () => {
    render(<PlanetariumProvider><TestConsumer /></PlanetariumProvider>);
    expect(screen.getByTestId('sky-mode').textContent).toBe('birth');
  });

  it('switches to current sky', async () => {
    render(<PlanetariumProvider><TestConsumer /></PlanetariumProvider>);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'current' })); });
    expect(screen.getByTestId('sky-mode').textContent).toBe('current');
  });

  it('switching to current sky enables planetariumMode', async () => {
    render(<PlanetariumProvider><TestConsumer /></PlanetariumProvider>);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'current' })); });
    expect(screen.getByTestId('planetarium').textContent).toBe('true');
  });
});
