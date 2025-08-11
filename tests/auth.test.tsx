import { vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import React from 'react';
import Auth from '@/pages/Auth';
import { renderWithProviders } from '../src/test/test-utils';

const signInMock = vi.fn().mockResolvedValue({ data: {}, error: null });

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signIn: signInMock,
    signUp: vi.fn(),
    resetPassword: vi.fn(),
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

it('Auth page submits sign in', async () => {
  renderWithProviders(<Auth />);
  const email = screen.getByLabelText(/email/i);
  const password = screen.getByLabelText(/password/i);
  fireEvent.change(email, { target: { value: 'user@example.com' } });
  fireEvent.change(password, { target: { value: 'secret123' } });
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
  await vi.waitFor(() => expect(signInMock).toHaveBeenCalledWith('user@example.com', 'secret123'));
});
