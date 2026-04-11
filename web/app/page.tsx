import HomeClient from '@/components/HomeClient';
import { readSourcesData } from '@/lib/source-data';

export default async function Home() {
  try {
    const initialData = await readSourcesData();
    return <HomeClient initialData={initialData} />;
  } catch {
    return <HomeClient initialData={null} />;
  }
}
