import { vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useVoiceChat } from '@/hooks/useVoiceChat';

vi.mock('@/hooks/useVoiceIntegration', () => ({
  useVoiceIntegration: () => ({
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    setTranscript: vi.fn(),
    speakText: vi.fn().mockResolvedValue(true),
    transcript: '',
    isRecording: false,
    isProcessingVoice: false,
    isPlayingAudio: false,
  }),
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const invokeMock = vi.fn().mockResolvedValue({
  data: { success: true, response: 'Hello there' },
  error: null,
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: invokeMock } },
}));

function TestComponent() {
  const { sendTextMessage } = useVoiceChat();
  return <button onClick={() => sendTextMessage('Hi')}>Send</button>;
}

it('useVoiceChat triggers ai-chat function', async () => {
  render(<TestComponent />);
  fireEvent.click(screen.getByText('Send'));
  await vi.waitFor(() =>
    expect(invokeMock).toHaveBeenCalledWith('ai-chat', {
      body: { question: 'Hi', correlation_id: expect.any(String) },
    })
  );
});
