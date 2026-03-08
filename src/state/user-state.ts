import { create } from "zustand/react";
import { User, LeaderboardData } from "@/types";

type UserState = {
  users: User[];
  updatedAt: string | null;
  setLeaderboard(data: LeaderboardData): void;
};

export const userState = create<UserState>((setState) => {
  return {
    users: [],
    updatedAt: null,
    setLeaderboard(data) {
      setState({ users: data.users, updatedAt: data.updatedAt });
    },
  };
});
