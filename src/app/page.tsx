"use client";

import React from "react";

const PER_PAGE = 100;

type User = {
  position: number;
  username: string;
  image: string;
  link: string;
  points: string;
};

export default function Home() {
  const [page, setPage] = React.useState(1);
  const [usernameQuery, setUsernameQuery] = React.useState("");

  const [users, setUsers] = React.useState<User[]>([]);

  React.useEffect(() => {
    fetch("leaderboard.json")
      .then((res) => res.json())
      .then(setUsers)
      .catch(console.error);
  }, []);

  const maxPage = React.useMemo(() => {
    return Math.ceil(users.length / PER_PAGE);
  }, [users]);

  const filteredUsers = React.useMemo(() => {
    const index = PER_PAGE * (page - 1);
    const query = usernameQuery.toLowerCase();
    return users.filter((user) => user.username.toLowerCase().startsWith(query)).slice(index, index + PER_PAGE);
  }, [users, page, usernameQuery]);

  React.useEffect(() => {
    setPage(1);
  }, [usernameQuery]);

  return (
    <main>
      <header>
        <h1>Risk Leaderboard</h1>
        <nav>
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
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user) => {
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
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}
