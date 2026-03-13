import { Eye } from "lucide-react";

export function ViewsView() {
  return (
    <div className="flex-1 flex flex-col bg-li-content-bg min-h-0">
      <div className="flex items-center h-11 px-4 border-b border-li-content-border shrink-0">
        <Eye className="h-4 w-4 text-li-text-muted mr-2" />
        <span className="text-[14px] font-medium text-li-text-bright">Views</span>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-2">
          <Eye className="h-10 w-10 text-li-text-muted mx-auto" />
          <p className="text-sm text-li-text-muted">No saved views</p>
        </div>
      </div>
    </div>
  );
}
