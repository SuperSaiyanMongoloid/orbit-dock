import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "@/lib/navigation";
import AppLayout from "./layouts/AppLayout";
import InboxPage from "./pages/Inbox";
import ReviewsPage from "./pages/Reviews";
import MyIssuesPage from "./pages/MyIssues";
import ProjectsPage from "./pages/Projects";
import ViewsPage from "./pages/Views";
import IssueDetailPage from "./pages/IssueDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/inbox" replace />} />
            <Route path="inbox" element={<InboxPage />} />
            <Route path="reviews" element={<ReviewsPage />} />
            <Route path="my-issues" element={<MyIssuesPage />} />
            <Route path="issues/:id" element={<IssueDetailPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="views" element={<ViewsPage />} />
            {/* Team-scoped routes */}
            <Route path=":teamId/issues" element={<MyIssuesPage />} />
            <Route path=":teamId/projects" element={<ProjectsPage />} />
            <Route path=":teamId/views" element={<ViewsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
