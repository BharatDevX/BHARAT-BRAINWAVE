import React, { useEffect, useState } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contract/index';
import Chart from './Chart';

const Result = () => {
  const [candidates, setCandidates] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [winner, setWinner] = useState(null);
  const [electionEnded, setElectionEnded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // fetch results and election state
  const loadResults = async () => {
    try {
      if (!window.ethereum) throw new Error('MetaMask not detected');
      setLoading(true);
      setError('');

      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      // check if election has ended
      const ended = await contract.electionEnd();
      setElectionEnded(ended);

      // total candidates
      const num = await contract.getNumberOfCandidates();
      const count = Number(num);

      // gather each candidate
      let data = [];
      let total = 0;
      for (let i = 1; i <= count; i++) {
        const [name, voteCountBN] = await contract.getCandidate(i);
        const voteCount = Number(voteCountBN);
        total += voteCount;
        data.push({ name, voteCount });
      }
      setCandidates(data);
      setTotalVotes(total);

      // if ended, fetch winner
      if (ended) {
        const winnerName = await contract.getResult();
        setWinner(winnerName);
      } else {
        setWinner(null);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResults();  
    const iv = setInterval(loadResults, 50000);
    return () => clearInterval(iv);
  }, []);

  // simple CSS-in-JS for pop animation
  const winnerStyle = {
    animation: 'pop 0.5s ease-in-out',
    fontSize: '1.5rem',
    color: '#2b6cb0',
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 text-center">Live Voting Results 🗳️</h2>

      {loading && <p className="text-center text-gray-600">Loading results...</p>}
      {error && <p className="text-center text-red-600">{error}</p>}

      {electionEnded && winner && (
        <div className="text-center mb-6">
          <div style={winnerStyle}>🏆 Congratulation {winner} you won the election🏆</div>
        </div>
      )}

      {!loading && !error && candidates.length === 0 && (
        <p className="text-center text-gray-700">No candidates found.</p>
      )}

      {candidates.map((c, idx) => {
        const pct = totalVotes === 0 ? 0 : (c.voteCount / totalVotes) * 100;
        const isWinner = electionEnded && winner === c.name;
        return (
          <div key={idx} className="mb-4">
            <div className={`flex justify-between mb-1 ${isWinner ? 'font-bold text-blue-700' : ''}`}>
              <span>{c.name}</span>
              <span>{c.voteCount} votes</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className={`h-4 transition-all duration-700 ease-in-out ${isWinner ? 'bg-blue-600' : 'bg-blue-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}

      <style>
        {`
        @keyframes pop {
          0%   { transform: scale(0.5); opacity: 0; }
          50%  { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1);   opacity: 1; }
        }
        `}
      </style>
      <Chart />
    </div>
  );
};

export default Result;
