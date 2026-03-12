export type User = {
  id: string;
  position: number;
  username: string;
  image: string;
  link: string;
  points: string;
};

export type LeaderboardData = {
  updatedAt: string;
  users: User[];
};
