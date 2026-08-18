import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import QuestionsPage from "./pages/QuestionsPage";
import HistoryPage from "./pages/HistoryPage";
import QuestionBankPage from "./pages/QuestionBankPage";

function AppShell() {
  const location = useLocation();
  const interviewMode = location.pathname === "/questions";
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {!interviewMode && <Navbar />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/questions" element={<QuestionsPage />} />
        <Route path="/question-bank" element={<QuestionBankPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
