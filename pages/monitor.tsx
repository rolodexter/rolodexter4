import { NextPage } from 'next';
import Layout from '../components/Layout';
import { TaskMonitor } from '../components/TaskMonitor';

const MonitorPage: NextPage = () => {
  return (
    <Layout>
      <div className="cyber-grid">
        <TaskMonitor />
      </div>
    </Layout>
  );
};

export default MonitorPage;