'use client';

import { VoiceAgentsQueryProvider } from '@/components/voice-agents/query-provider';
import { ScaffoldGallery } from '@/components/dmaas/scaffolds/scaffold-gallery';

export function ScaffoldsClient() {
  return (
    <VoiceAgentsQueryProvider>
      <ScaffoldGallery />
    </VoiceAgentsQueryProvider>
  );
}
