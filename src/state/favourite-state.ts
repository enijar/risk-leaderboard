import { create } from "zustand/react";
import { get, update } from "idb-keyval";
import { User } from "@/types";
import { userState } from "@/state/user-state";

type UserId = User["id"];

type FavouriteState = {
  favourites: User[];
  init(): Promise<void>;
  add(userId: UserId): Promise<void>;
  remove(userId: UserId): Promise<void>;
};

const DB_KEY = "favourite";

async function all() {
  const userIds = (await get<UserId[]>(DB_KEY)) ?? [];
  return userState.getState().users.filter((user) => {
    return userIds.includes(user.id);
  });
}

export const favouriteState = create<FavouriteState>((setState) => {
  return {
    favourites: [],
    async init() {
      setState({ favourites: await all() });
    },
    async add(userId: UserId) {
      await update<UserId[]>(DB_KEY, (userIds) => {
        return [...(userIds ?? []), userId];
      });
      setState({ favourites: await all() });
    },
    async remove(userId: UserId) {
      await update<UserId[]>(DB_KEY, (users) => {
        return (users ?? []).filter((savedUserId) => {
          return savedUserId !== userId;
        });
      });
      setState({ favourites: await all() });
    },
  };
});
