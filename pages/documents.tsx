import { DocumentList } from '../components/documents/DocumentList';

export default function DocumentsPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div>
        <DocumentList
          type="task"
          status="ACTIVE"
          limit={5}
          title="Active Tasks"
        />
      </div>
      <div>
        <DocumentList
          type="memory"
          limit={5}
          title="Recent Memories"
        />
      </div>
      <div>
        <DocumentList
          type="documentation"
          limit={5}
          title="Documentation"
        />
      </div>
      <div>
        <DocumentList
          tags={['important']}
          limit={5}
          title="Important Documents"
          showType={true}
        />
      </div>
    </div>
  );
}