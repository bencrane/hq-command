import { VoiceAgentsQueryProvider } from '@/components/voice-agents/query-provider';

export default function VoiceAgentsLayout({ children }: { children: React.ReactNode }) {
  return <VoiceAgentsQueryProvider>{children}</VoiceAgentsQueryProvider>;
}
