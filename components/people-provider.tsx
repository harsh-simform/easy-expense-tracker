"use client";

import { createContext, useContext } from "react";
import type { Person } from "@/types/database";

const PeopleContext = createContext<Person[]>([]);

export function PeopleProvider({
  people,
  children,
}: {
  people: Person[];
  children: React.ReactNode;
}) {
  return <PeopleContext.Provider value={people}>{children}</PeopleContext.Provider>;
}

export function usePeople() {
  return useContext(PeopleContext);
}
