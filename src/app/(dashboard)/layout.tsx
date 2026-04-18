'use client';

import { createContext, useContext, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/Sidebar';
import { ModeType } from '@/lib/types';

interface DashboardContextType {
  currentMode: ModeType;
  setCurrentMode: (mode: ModeType) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardLayout');
  }
  return context;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentMode, setCurrentMode] = useState<ModeType>('chat');

  return (
    <AuthGuard>
      <DashboardContext.Provider value={{ currentMode, setCurrentMode }}>
        <div className="min-h-screen bg-bg-primary">
          <Sidebar currentMode={currentMode} onModeChange={setCurrentMode} />
          <main className="lg:ml-[260px] min-h-screen">
            {children}
          </main>
        </div>
      </DashboardContext.Provider>
    </AuthGuard>
  );
}
