import { NextPage } from 'next';
import Layout from '../components/Layout';
import { TaskMonitor } from '../components/TaskMonitor';
import { CyborgFrame } from '../components/CyborgFrame';

const MonitorPage: NextPage = () => {
  return (
    <Layout>
      <div className="relative min-h-screen overflow-hidden bg-black">
        <div className="absolute inset-0 flex items-center justify-center">
          <CyborgFrame />
        </div>
        <div className="relative z-10">
          <TaskMonitor />
        </div>
      </div>
    </Layout>
  );
};

export default MonitorPage;