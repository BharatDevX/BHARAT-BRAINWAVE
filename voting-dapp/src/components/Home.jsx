import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center  text-white p-6 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600">
      <h1 className="text-5xl font-extrabold mb-4 flex">Welcome to <div className="text-4xl font-bold bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-pink-500 text-transparent bg-clip-text ml-3 mt-2">I-VOTE</div></h1>
      <p className="text-lg mb-8 text-center max-w-xl">
        A decentralized online Voting app
      </p>

      <div className="space-x-4">
        <Link
          to="/vote"
          className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg font-semibold transition"
        >
          🗳️ Vote
        </Link>
        <Link
          to="/result"
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition"
        >
          📊 Results
        </Link>
        <Link
          to="/admin"
          className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-lg font-semibold transition"
        >
          🛠️ Admin
        </Link>
      </div>
    </div>
  );
};

export default Home;
