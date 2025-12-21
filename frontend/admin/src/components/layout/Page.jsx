import React from "react";

export default function Page({ title, children }) {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-5xl mx-auto px-6">
        <h1 className="text-xl font-semibold mb-6">
          {title}
        </h1>

        <div className="bg-white border border-gray-300 rounded-lg p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
