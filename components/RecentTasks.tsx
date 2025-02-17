import DocumentList from './DocumentList';

const RecentTasks = () => {
  return (
    <DocumentList
      type="task"
      status="ACTIVE"
      limit={7}
      title="CURRENT TASKS"
      showType={false}
    />
  );
};

export default RecentTasks;