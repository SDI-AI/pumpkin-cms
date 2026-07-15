import { requireStarterAdmin } from '@/lib/admin-auth';
import { VisualPreviewFrame } from './VisualPreviewFrame';

export const dynamic = 'force-dynamic';

export default async function VisualPreviewPage() {
  await requireStarterAdmin();
  return <VisualPreviewFrame />;
}
