import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyzeliumNetwork } from '../components/onboarding/MyzeliumNetwork';

describe('MyzeliumNetwork', () => {
  it('renders an SVG element', () => {
    render(<MyzeliumNetwork leftAnchor={{ x: 100, y: 300 }} rightAnchor={{ x: 500, y: 300 }} />);
    const svg = screen.getByTestId('myzelium-svg');
    expect(svg.tagName.toLowerCase()).toBe('svg');
  });

  it('renders paths between anchors', () => {
    const { container } = render(
      <MyzeliumNetwork leftAnchor={{ x: 100, y: 300 }} rightAnchor={{ x: 500, y: 300 }} />
    );
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThanOrEqual(3);
  });

  it('has zero opacity when active=false', () => {
    render(
      <MyzeliumNetwork leftAnchor={{ x: 100, y: 300 }} rightAnchor={{ x: 500, y: 300 }} active={false} />
    );
    const svg = screen.getByTestId('myzelium-svg');
    const cls = svg.className.baseVal || svg.getAttribute('class') || '';
    expect(cls).toContain('opacity-0');
  });

  it('renders junction nodes', () => {
    const { container } = render(
      <MyzeliumNetwork leftAnchor={{ x: 100, y: 300 }} rightAnchor={{ x: 500, y: 300 }} />
    );
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThanOrEqual(2);
  });
});
