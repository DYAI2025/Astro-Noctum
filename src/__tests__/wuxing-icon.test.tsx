// Tests: WuXingIcon accessibility — aria-label correctness for all elements
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { WuXingIcon } from '../components/animated-icons/CosmicSymbols';

describe('WuXingIcon aria-label', () => {
  const cases = [
    { element: 'Wood', expected: 'Holz' },
    { element: 'Fire', expected: 'Feuer' },
    { element: 'Earth', expected: 'Erde' },
    { element: 'Metal', expected: 'Metall' },
    { element: 'Water', expected: 'Wasser' },
  ] as const;

  cases.forEach(({ element, expected }) => {
    it(`${element} renders with aria-label "${expected}"`, () => {
      const { container } = render(<WuXingIcon element={element} />);
      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('aria-label')).toBe(expected);
    });
  });

  it('Metal svg does not have aria-label "diamond"', () => {
    const { container } = render(<WuXingIcon element="Metal" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-label')).not.toBe('diamond');
  });

  it('Metal svg does not have aria-label "wind"', () => {
    const { container } = render(<WuXingIcon element="Metal" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-label')).not.toBe('wind');
  });

  it('German aliases also get German aria-label', () => {
    const { container } = render(<WuXingIcon element="Metall" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-label')).toBe('Metall');
  });
});
