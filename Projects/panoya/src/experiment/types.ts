import type { AdKey } from '@/protocol/ads';
import type { Condition, ModuleId } from '@/protocol/conditions';

export interface AppRow { key: AdKey; when: string; status: 'pending' | 'rejected' | 'new' }

/** İstemciye giden katılımcı durumu. `condition` yalnızca test kaydında ya da bilgilendirmede doludur. */
export interface ParticipantView {
  code: string;
  module: ModuleId;
  isTest: boolean;
  fastMode: boolean;
  showNotes: boolean;
  status: 'olusturuldu' | 'devam' | 'tamamlandi' | 'iptal';
  stepIndex: number;
  stepIds: string[];
  roundOrder: AdKey[] | null;
  chosenAd: AdKey | null;
  apps: AppRow[];
  recipient: { name: string; email: string } | null;
  condition: Condition | null;
  assignment: 'blok' | 'manuel' | null;
}
