import type { NextPage } from 'next';
import { RecentTasks } from '@components/tasks/RecentTasks';
import { CyberpunkFrame } from '@components/common/CyberpunkFrame';

const Home: NextPage = () => {
  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <div className="h-screen flex items-center justify-center p-4 sm:p-6 md:p-8">
        <CyberpunkFrame className="w-full max-w-3xl">
          <RecentTasks />
        </CyberpunkFrame>
      </div>
    </div>
  );
};

export default Home;