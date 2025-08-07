import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { VoiceButton } from '@/components/ui/voice-button';

describe('VoiceButton', () => {
  it('calls onStartRecording when not recording', async () => {
    const onStart = vi.fn();
    const onStop = vi.fn();

    const { getByRole } = render(
      <VoiceButton
        isRecording={false}
        isLoading={false}
        onStartRecording={onStart}
        onStopRecording={onStop}
      />
    );

    const button = getByRole('button');
    await userEvent.click(button);
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStop).not.toHaveBeenCalled();
  });

  it('calls onStopRecording when recording', async () => {
    const onStart = vi.fn();
    const onStop = vi.fn();

    const { getByRole } = render(
      <VoiceButton
        isRecording={true}
        isLoading={false}
        onStartRecording={onStart}
        onStopRecording={onStop}
      />
    );

    const button = getByRole('button');
    await userEvent.click(button);
    expect(onStop).toHaveBeenCalledTimes(1);
    expect(onStart).not.toHaveBeenCalled();
  });
});
