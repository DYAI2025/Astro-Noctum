import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SharePopup } from '@/src/components/SharePopup';

vi.mock('@/src/contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'de', t: (k: string) => k }),
}));

describe('SharePopup', () => {
  it('renders 4 social media buttons', () => {
    render(<SharePopup quizTitle="Krafttier" resultTitle="Der Wolf" onClose={vi.fn()} />);
    expect(screen.getByLabelText('WhatsApp')).toBeDefined();
    expect(screen.getByLabelText('Facebook')).toBeDefined();
    expect(screen.getByLabelText('Instagram')).toBeDefined();
    expect(screen.getByLabelText('TikTok')).toBeDefined();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<SharePopup quizTitle="Krafttier" resultTitle="Der Wolf" onClose={onClose} />);
    fireEvent.click(screen.getByTestId('share-backdrop'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('generates correct WhatsApp share URL', () => {
    render(<SharePopup quizTitle="Krafttier" resultTitle="Der Wolf" onClose={vi.fn()} />);
    const wa = screen.getByLabelText('WhatsApp');
    expect(wa.getAttribute('href')).toContain('api.whatsapp.com');
    expect(wa.getAttribute('href')).toContain('Krafttier');
  });
});
