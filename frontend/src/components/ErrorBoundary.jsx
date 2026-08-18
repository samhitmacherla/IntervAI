import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || "Unexpected interface error" };
  }

  componentDidCatch(error, info) {
    console.error("InterviewAI render error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 px-6 py-16 text-center text-slate-900">
          <div className="mx-auto max-w-lg rounded-3xl border border-rose-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-black">Something went wrong loading this page</h1>
            <p className="mt-2 text-sm text-slate-500">The interview session data could not be rendered safely.</p>
            <p className="mt-4 rounded-xl bg-rose-50 p-3 text-left text-xs font-mono text-rose-700">{this.state.message}</p>
            <button className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white" onClick={() => window.location.reload()}>Reload application</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
