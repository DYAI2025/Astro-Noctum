import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DayPulseExpanded } from '../components/dashboard/DayPulseExpanded';
import type { TransitEvent } from '../lib/schemas/transit-state';

// ── Mock language context ────────────────────────────────────────────────────
vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'de', t: (k: string) => k }),
}));

// ── Fixtures ─────────────────────────────────────────────────────────────────

const makeEvent = (overrides: Partial<TransitEvent> = {}): TransitEvent => ({
  id: 'test-event-1',
  type: 'trine',
  sector: 3,
  delta: 0.5,
  trigger_planet: 'Mars',
  trigger_symbol: '♂',
  sector_domain: 'Kommunikation',
  description_de: 'Mars tritt in Trigon zu deiner Venus — heute läuft Austausch leicht.',
  personal_context: 'Besonders spürbar in Bereichen Kreativität und Ausdruck.',
  priority: 5,
  ...overrides,
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('DayPulseExpanded', () => {
  it('renders mode badge for pulse day', () => {
    render(<DayPulseExpanded events={[]} dayMode="pulse" />);
    expect(screen.getByText('Tages-Impuls')).toBeInTheDocument();
  });

  it('renders mode badge for trace day', () => {
    render(<DayPulseExpanded events={[]} dayMode="trace" />);
    expect(screen.getByText('Tages-Spur')).toBeInTheDocument();
  });

  it('shows fallback text when events is empty', () => {
    render(<DayPulseExpanded events={[]} dayMode="pulse" />);
    expect(screen.getByTestId('day-pulse-fallback')).toBeInTheDocument();
    expect(screen.getByText(/Heute keine markanten Ereignisse/)).toBeInTheDocument();
  });

  it('renders verbatim description_de from first event', () => {
    const event = makeEvent();
    render(<DayPulseExpanded events={[event]} dayMode="pulse" />);
    expect(screen.getByText(event.description_de!)).toBeInTheDocument();
  });

  it('renders personal_context verbatim when present', () => {
    const event = makeEvent();
    render(<DayPulseExpanded events={[event]} dayMode="pulse" />);
    expect(screen.getByText(event.personal_context!)).toBeInTheDocument();
  });

  it('does NOT show fallback when event text is available', () => {
    render(<DayPulseExpanded events={[makeEvent()]} dayMode="pulse" />);
    expect(screen.queryByTestId('day-pulse-fallback')).toBeNull();
  });

  it('picks highest-priority event when multiple events given', () => {
    const low  = makeEvent({ id: 'low',  priority: 1, description_de: 'Niedrige Priorität' });
    const high = makeEvent({ id: 'high', priority: 9, description_de: 'Hohe Priorität' });
    render(<DayPulseExpanded events={[low, high]} dayMode="trace" />);
    expect(screen.getByText('Hohe Priorität')).toBeInTheDocument();
    expect(screen.queryByText('Niedrige Priorität')).toBeNull();
  });

  it('shows trigger planet when present', () => {
    render(<DayPulseExpanded events={[makeEvent()]} dayMode="pulse" />);
    expect(screen.getByText('Mars')).toBeInTheDocument();
  });

  it('hides personal_context when it is empty', () => {
    const event = makeEvent({ personal_context: '' });
    render(<DayPulseExpanded events={[event]} dayMode="pulse" />);
    // description_de is visible, no personal_context element
    expect(screen.getByText(event.description_de!)).toBeInTheDocument();
    expect(screen.queryByRole('paragraph', { name: /spürbar/ })).toBeNull();
  });

  it('renders skeleton when loading=true', () => {
    const { container } = render(<DayPulseExpanded events={[]} dayMode="pulse" loading />);
    expect(container.querySelector('.animate-pulse')).toBeTruthy();
    expect(screen.queryByTestId('day-pulse-expanded')).toBeNull();
  });

  it('never collapses — data-testid is always in DOM when not loading', () => {
    render(<DayPulseExpanded events={[]} dayMode="pulse" />);
    expect(screen.getByTestId('day-pulse-expanded')).toBeInTheDocument();
  });
});
