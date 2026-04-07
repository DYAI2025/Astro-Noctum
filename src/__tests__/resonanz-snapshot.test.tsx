import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ResonanzSnapshot } from '../components/dashboard/ResonanzSnapshot';
import type { ResonanceBadge } from '../lib/schemas/experience';

const TRANSIT_BADGE: ResonanceBadge = {
  type: 'transit',
  label: 'Mars Trigon · Verstärkend',
  sublabel: '88%',
  intensity: 'hoch',
  color: '#D4AF37',
};

const SPACE_BADGE: ResonanceBadge = {
  type: 'space_weather',
  label: 'Kp 3.2 · Ruhig',
  sublabel: 'Kosmisches Wetter',
  intensity: 'niedrig',
  color: '#4CAF50',
};

const SEKTOR_BADGE: ResonanceBadge = {
  type: 'sektor',
  label: '♈ Widder',
  sublabel: 'Dein Leitsystem',
  intensity: 'hoch',
  color: '#8B6CD4',
};

describe('ResonanzSnapshot', () => {
  it('renders nothing when badges array is empty', () => {
    const { container } = render(<ResonanzSnapshot badges={[]} isPremium={true} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders badge labels for premium user', () => {
    render(<ResonanzSnapshot badges={[TRANSIT_BADGE, SPACE_BADGE]} isPremium={true} />);
    expect(screen.getByText('Mars Trigon · Verstärkend')).toBeInTheDocument();
    expect(screen.getByText('Kp 3.2 · Ruhig')).toBeInTheDocument();
  });

  it('renders sublabels', () => {
    render(<ResonanzSnapshot badges={[TRANSIT_BADGE]} isPremium={true} />);
    expect(screen.getByText('88%')).toBeInTheDocument();
  });

  it('applies opacity-60 for free user', () => {
    render(<ResonanzSnapshot badges={[TRANSIT_BADGE]} isPremium={false} />);
    expect(screen.getByTestId('resonanz-badge-transit')).toHaveClass('opacity-60');
  });

  it('renders all 3 badge types', () => {
    render(<ResonanzSnapshot badges={[TRANSIT_BADGE, SPACE_BADGE, SEKTOR_BADGE]} isPremium={true} />);
    expect(screen.getByText('Mars Trigon · Verstärkend')).toBeInTheDocument();
    expect(screen.getByText('Kp 3.2 · Ruhig')).toBeInTheDocument();
    expect(screen.getByText('♈ Widder')).toBeInTheDocument();
  });

  it('does not apply opacity-60 for premium user', () => {
    render(<ResonanzSnapshot badges={[TRANSIT_BADGE]} isPremium={true} />);
    expect(screen.getByTestId('resonanz-badge-transit')).not.toHaveClass('opacity-60');
  });

  it('renders lock icon for free user (aria-hidden)', () => {
    render(<ResonanzSnapshot badges={[TRANSIT_BADGE]} isPremium={false} />);
    // Lock SVG is rendered inside the badge for free users
    const badge = screen.getByTestId('resonanz-badge-transit');
    expect(badge.querySelector('svg')).toBeTruthy();
  });

  it('does not render lock icon for premium user', () => {
    render(<ResonanzSnapshot badges={[TRANSIT_BADGE]} isPremium={true} />);
    const badge = screen.getByTestId('resonanz-badge-transit');
    expect(badge.querySelector('svg')).toBeNull();
  });
});
