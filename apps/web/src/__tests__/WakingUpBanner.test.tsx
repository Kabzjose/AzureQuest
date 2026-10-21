import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WakingUpBanner } from '../../components/ui/WakingUpBanner';

describe('WakingUpBanner', () => {
  it('renders the waking up message', () => {
    render(<WakingUpBanner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/Waking up the server/i)).toBeInTheDocument();
  });

  it('has aria-live polite for accessibility', () => {
    render(<WakingUpBanner />);
    const banner = screen.getByRole('status');
    expect(banner).toHaveAttribute('aria-live', 'polite');
  });
});
