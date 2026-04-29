import { Designer } from '@/components/dmaas/designer';

/**
 * DMaaS — direct mail postcard designer. Sits inside the admin shell, but
 * takes the full viewport (the shell's `HQ` link and sign-out float on top).
 */
export default function DMaaSPage() {
  return (
    <div className="fixed inset-0 z-0">
      <Designer />
    </div>
  );
}
