"use client";

import React from "react";
import * as AppStyle from "@/components/app-styles";
import { favouriteState } from "@/state/favourite-state";
import { userState } from "@/state/user-state";
import FavouriteIcon from "@/icons/favourite-icon";

const PER_PAGE = 100;

export default function Home() {
  const [page, setPage] = React.useState(1);
  const [usernameQuery, setUsernameQuery] = React.useState("");
  React.useEffect(() => {
    setPage(1);
  }, [usernameQuery]);

  const users = userState((state) => state.users);
  React.useEffect(() => {
    fetch(`leaderboard.json?t=${Date.now()}`)
      .then((res) => res.json())
      .then(userState.getState().setUsers)
      .catch(console.error);
  }, []);
  React.useEffect(() => {
    favouriteState.getState().init().catch(console.error);
  }, [users]);

  const maxPage = React.useMemo(() => {
    return Math.ceil(users.length / PER_PAGE);
  }, [users]);

  const favourites = favouriteState((state) => state.favourites);
  const [showFavourites, setShowFavourites] = React.useState(false);

  React.useEffect(() => {
    setPage(1);
  }, [showFavourites]);

  React.useEffect(() => {
    if (favourites.length === 0) {
      setShowFavourites(false);
    }
  }, [favourites]);

  const filteredUsers = React.useMemo(() => {
    if (showFavourites) {
      return favourites;
    }
    const index = PER_PAGE * (page - 1);
    const query = usernameQuery.toLowerCase();
    return users.filter((user) => user.username.toLowerCase().startsWith(query)).slice(index, index + PER_PAGE);
  }, [users, page, usernameQuery, showFavourites, favourites]);

  return (
    <main>
      <header>
        <h1>
          Risk Leaderboard <small>(Updated Hourly)</small>
          <span>&nbsp;</span>
        </h1>
        <nav>
          {favourites.length > 0 && (
            <button onClick={() => setShowFavourites((showFavourites) => !showFavourites)}>
              {showFavourites ? "Hide" : "Show"} Favourites
            </button>
          )}
          <button onClick={() => setPage(1)}>First</button>
          <button onClick={() => setPage((page) => Math.max(1, page - 1))}>Prev</button>
          <button onClick={() => setPage((page) => Math.min(maxPage, page + 1))}>Next</button>
          <button onClick={() => setPage(maxPage)}>Last</button>
          <input
            type="text"
            name="query"
            placeholder="Search a username..."
            onChange={(event) => setUsernameQuery(event.target.value)}
          />
        </nav>
      </header>
      <table>
        <thead>
          <tr>
            <th>Position</th>
            <th>Username</th>
            <th>Image</th>
            <th>Profile Link</th>
            <th>Points</th>
            <th>Favourite</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user) => {
            const favourite = favourites.some((favourite) => favourite.id === user.id);
            return (
              <tr key={user.position}>
                <td>{user.position}</td>
                <td>{user.username}</td>
                <td>
                  <img src={user.image} alt={user.username} />
                </td>
                <td>
                  <a href={user.link} target="_blank" rel="noreferrer">
                    View Profile
                  </a>
                </td>
                <td>{user.points}</td>
                <td>
                  <AppStyle.FavouriteButton
                    title={`${favourite ? "Remove from" : "Add to"} favourites`}
                    aria-selected={favourite}
                    onClick={() => {
                      const state = favouriteState.getState();
                      if (favourite) {
                        state.remove(user.id).catch(console.error);
                      } else {
                        state.add(user.id).catch(console.error);
                      }
                    }}
                  >
                    <FavouriteIcon />
                  </AppStyle.FavouriteButton>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}
