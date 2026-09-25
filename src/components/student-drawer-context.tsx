"use client";

import React, { createContext, useContext, useState } from "react";
import { StudentDrawer } from "./student-drawer";

interface StudentDrawerContextType {
  openStudent: (id: number) => void;
  closeStudent: () => void;
  selectedStudentId: number | null;
}

const StudentDrawerContext = createContext<StudentDrawerContextType | undefined>(undefined);

export function StudentDrawerProvider({ children }: { children: React.ReactNode }) {
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  function openStudent(id: number) {
    setSelectedStudentId(id);
  }

  function closeStudent() {
    setSelectedStudentId(null);
  }

  return (
    <StudentDrawerContext.Provider
      value={{ openStudent, closeStudent, selectedStudentId }}
    >
      {children}
      <StudentDrawer
        studentId={selectedStudentId}
        onClose={closeStudent}
      />
    </StudentDrawerContext.Provider>
  );
}

export function useStudentDrawer() {
  const context = useContext(StudentDrawerContext);
  if (!context) {
    throw new Error("useStudentDrawer must be used within a StudentDrawerProvider");
  }
  return context;
}
