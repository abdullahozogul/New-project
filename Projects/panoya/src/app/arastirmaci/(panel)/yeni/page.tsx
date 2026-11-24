import { PageHead } from '@/components/admin/ui';
import { CreateForm } from '@/components/admin/CreateForm';

export const metadata = { title: 'Katılımcı kaydı' };

export default function NewParticipant() {
  return (
    <>
      <PageHead title="Katılımcı kaydı" sub="Anonim katılımcı kodu oluşturun. Koşul katılımcıya deney tamamlanana kadar gösterilmez." />
      <CreateForm />
    </>
  );
}
