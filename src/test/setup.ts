import '@testing-library/jest-dom';
import { vi } from 'vitest';

// matchMedia mock
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

// speechSynthesis mock
interface MockSpeechSynthesis {
  speak: ReturnType<typeof vi.fn>;
  cancel: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  resume: ReturnType<typeof vi.fn>;
  getVoices: ReturnType<typeof vi.fn>;
}

if (!('speechSynthesis' in window)) {
  (window as unknown as { speechSynthesis: MockSpeechSynthesis }).speechSynthesis = {
    speak: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: vi.fn(() => []),
  };
}

// Audio mock
class MockAudio {
  src = '';
  currentTime = 0;
  duration = 1;
  onloadedmetadata?: () => void;
  onended?: () => void;
  onerror?: () => void;
  play = vi.fn().mockResolvedValue(undefined);
  pause = vi.fn();
  constructor(src?: string) {
    if (src) this.src = src;
    setTimeout(() => {
      this.onloadedmetadata && this.onloadedmetadata();
    }, 0);
  }
}

// @ts-expect-error - MockAudio is a test replacement for the global Audio constructor
(globalThis as typeof globalThis & { Audio: typeof MockAudio }).Audio = MockAudio;
