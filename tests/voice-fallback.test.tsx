import { vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useAdvancedTTS } from '@/hooks/useAdvancedTTS';

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/integrations/supabase/client', () => {
  const invokeMock = vi.fn().mockResolvedValue({
    data: null,
    error: new Error('fail'),
  });
  
  return {
    supabase: { functions: { invoke: invokeMock } },
  };
});

function TTSComponent() {
  const { speak } = useAdvancedTTS();
  return <button onClick={() => speak('Hello world', 'en', true)}>Speak</button>;
}

it('falls back to browser speech when ElevenLabs fails', async () => {
  const speakSpy = vi.spyOn(window.speechSynthesis, 'speak');
  const mockSpeechSynthesis = window.speechSynthesis as unknown as { getVoices: ReturnType<typeof vi.fn> };
  mockSpeechSynthesis.getVoices.mockReturnValue([
    { name: 'Google US English', lang: 'en-US' },
  ]);
  render(<TTSComponent />);
  fireEvent.click(screen.getByText('Speak'));
  await vi.waitFor(() => expect(speakSpy).toHaveBeenCalled());
});
