import { IssuesView } from "@/features/issues/issues-view";
import { useNavigate } from "@/lib/navigation";

export default function MyIssuesPage() {
  const navigate = useNavigate();
  return (
    <IssuesView
      onIssueSelect={(issue) => navigate(`/issues/${issue.id}`)}
      onFilterChange={undefined}
    />
  );
}
