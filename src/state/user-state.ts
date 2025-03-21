import { create } from "zustand/react";
import { User } from "@/types";

type UserState = {
  users: User[];
  setUsers(users: User[]): void;
};

export const userState = create<UserState>((setState) => {
  return {
    users: [],
    setUsers(users) {
      setState({ users });
    },
  };
});
