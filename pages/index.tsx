import type { NextPage } from 'next';
import { RecentTasks } from '@components/tasks/RecentTasks';

const Home: NextPage = () => {
  return (
    <div className="min-h-screen bg-black text-white p-4">
      <RecentTasks />
    </div>
  );
};

export default Home;