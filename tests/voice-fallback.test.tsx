import { vi, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
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

// Mock SpeechSynthesisUtterance
global.SpeechSynthesisUtterance = class MockSpeechSynthesisUtterance {
  text = '';
  lang = '';
  voice: any = null;
  rate = 1;
  pitch = 1;
  volume = 1;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  
  constructor(text?: string) {
    if (text) this.text = text;
  }
} as any;

function TTSComponent() {
  const { speak } = useAdvancedTTS();
  
  const handleSpeak = async () => {
    await speak('Hello world', 'en', true);
  };
  
  return <button onClick={handleSpeak}>Speak</button>;
}

it('falls back to browser speech when ElevenLabs fails', async () => {
  const speakSpy = vi.spyOn(window.speechSynthesis, 'speak');
  const mockSpeechSynthesis = window.speechSynthesis as any;
  
  // Setup mock voices
  mockSpeechSynthesis.getVoices.mockReturnValue([
    { name: 'Google US English', lang: 'en-US', default: true },
  ]);
  
  await act(async () => {
    render(<TTSComponent />);
  });
  
  await act(async () => {
    fireEvent.click(screen.getByText('Speak'));
  });
  
  // Wait a bit for async operations
  await new Promise(resolve => setTimeout(resolve, 100));
  
  expect(speakSpy).toHaveBeenCalled();
});
