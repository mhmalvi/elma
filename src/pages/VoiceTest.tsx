import React from 'react';
import { VoiceTestSuite } from '@/components/voice/VoiceTestSuite';
import { VoiceQualityTester } from '@/components/voice/VoiceQualityTester';

const VoiceTest = () => {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Voice Testing Suite</h1>
        <p className="text-muted-foreground">
          Test and optimize voice functionality for the best user experience
        </p>
      </div>
      
      <VoiceTestSuite />
      <VoiceQualityTester />
    </div>
  );
};

export default VoiceTest;