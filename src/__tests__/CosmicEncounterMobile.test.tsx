import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CosmicEncounterMobile } from '../components/onboarding/CosmicEncounterMobile';

describe('CosmicEncounterMobile', () => {
  it('renders form and levi artifacts', () => {
    render(<CosmicEncounterMobile phase="materializing" />);
    expect(screen.getByTestId('mobile-form-artifact')).toBeDefined();
    expect(screen.getByTestId('mobile-levi-artifact')).toBeDefined();
  });

  it('renders container with test id', () => {
    render(<CosmicEncounterMobile phase="materializing" />);
    expect(screen.getByTestId('cosmic-mobile')).toBeDefined();
  });

  it('applies parallax transform via style', () => {
    render(
      <CosmicEncounterMobile
        phase="materializing"
        formOffset={{ x: 10, y: 5 }}
        leviOffset={{ x: -15, y: -8 }}
      />
    );
    const form = screen.getByTestId('mobile-form-artifact');
    expect(form.style.transform).toContain('translate');
  });
});
