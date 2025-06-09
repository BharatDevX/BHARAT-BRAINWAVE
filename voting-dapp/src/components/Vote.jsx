import React, { useEffect, useState, useRef } from 'react';
import { useAccount } from 'wagmi';
import { FaVoteYea } from "react-icons/fa";
import { BrowserProvider, Contract } from 'ethers';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../contract/index';
import Confetti from 'react-dom-confetti';

const Vote = () => {
  const { address, isConnected } = useAccount();
  const [provider, setProvider] = useState(null);
  const [isRegistered, setIsRegistered] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [electionStarted, setElectionStarted] = useState(false);
  const [electionEnded, setElectionEnded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [votingCandidateId, setVotingCandidateId] = useState(null);
  const [confettiState, setConfettiState] = useState({});

  const confettiConfig = {
    angle: 90,
    spread: 60,
    startVelocity: 30,
    elementCount: 50,
    dragFriction: 0.12,
    duration: 3000,
    stagger: 3,
    width: "10px",
    height: "10px",
    perspective: "700px",
    colors: ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"]
  };

  // 1️⃣ Initialize provider & check registration
  useEffect(() => {
    const init = async () => {
      if (!window.ethereum) {
        setError('🔌 Please install MetaMask.');
        setLoading(false);
        return;
      }
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const bp = new BrowserProvider(window.ethereum);
      setProvider(bp);

      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, bp);
      const reg = await contract.isRegistered(address);
      setIsRegistered(reg);
    };
    if (isConnected) init();
  }, [isConnected, address]);

  // 2️⃣ Fetch election & candidates
  useEffect(() => {
    if (!provider || isRegistered === null) return;

    const fetchData = async () => {
      try {
        setError('');
        setLoading(true);

        const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

        const started = await contract.electionStart();
        const ended = await contract.electionEnd();
        setElectionStarted(started);
        setElectionEnded(ended);

        if (!started || ended) {
          setCandidates([]);
          return;
        }

        const count = await contract.getNumberOfCandidates();
        const list = [];
        for (let i = 1; i <= count; i++) {
          const [name, voteCount] = await contract.getCandidate(i);
          list.push({ id: i, name, voteCount: Number(voteCount) });
        }
        setCandidates(list);
      } catch (err) {
        console.error(err);
        setError('❌ Failed to load election data.');
      } finally {
        setLoading(false);
      }
    };

    if (isRegistered) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [provider, isRegistered]);

  // 3️⃣ Handle vote + confetti
  const handleVote = async (candidateId) => {
    try {
      setError('');
      setSuccess('');
      setVotingCandidateId(candidateId);

      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const started = await contract.electionStart();
      const ended = await contract.electionEnd();
      if (!started) return setError('⚠️ Election has not started yet.');
      if (ended) return setError('⚠️ Election has already ended.');

      const tx = await contract.vote(candidateId);
      await tx.wait();

      setSuccess('✅ Vote cast successfully!');
      setConfettiState((prev) => ({ ...prev, [candidateId]: true }));
      setTimeout(() => {
        setConfettiState((prev) => ({ ...prev, [candidateId]: false }));
      }, 3000);

      const readOnly = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const count = await readOnly.getNumberOfCandidates();
      const list = [];
      for (let i = 1; i <= count; i++) {
        const [name, voteCount] = await readOnly.getCandidate(i);
        list.push({ id: i, name, voteCount: Number(voteCount) });
      }
      setCandidates(list);
    } catch (err) {
      console.error(err);
      const msg = err?.error?.message || err?.message || '';
      if (msg.includes('Not registered')) {
        setError('⚠️ You are not registered to vote.');
      } else if (msg.includes('You have already voted')) {
        setError('⚠️ You have already voted.');
      } else if (msg.includes('Election is not active')) {
        setError('⚠️ Election is not active.');
      } else if (msg.toLowerCase().includes('user rejected')) {
        setError('❌ Transaction cancelled.');
      } else {
        setError('❌ Transaction failed.');
      }
    } finally {
      setVotingCandidateId(null);
    }
  };

  const handleRegisterSelf = async () => {
    try {
      setError('');
      setSuccess('🔄 Registering you as a voter...');
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.registerSelf();
      await tx.wait();
      setSuccess('✅ Successfully registered to vote!');
      setIsRegistered(true);
    } catch (err) {
      console.error(err);
      const msg = err?.error?.message || err?.message || '';
      if (msg.includes('Already registered')) {
        setError('⚠️ You are already registered.');
      } else if (msg.toLowerCase().includes('user rejected')) {
        setError('❌ Transaction cancelled.');
      } else {
        setError('❌ Registration failed.');
      }
    }
  };

  if (loading) {
    return <div className="text-center text-gray-600 mt-6">Initializing...</div>;
  }
  if (!isConnected) {
    return <div className="text-center text-red-500 mt-6">🔌 Connect your wallet to vote.</div>;
  }
  if (!isRegistered) {
    return (
      <div className="text-center text-orange-600 mt-6">
        ⚠️ You are not registered to vote.
        <div className="mt-3">
          <button
            onClick={handleRegisterSelf}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Register Now
          </button>
        </div>
      </div>
    );
  }

  if (!electionStarted) {
    return <div className="text-center text-orange-500 mt-6">📢 Election has not started yet.</div>;
  }
  if (electionEnded) {
    return <div className="text-center text-red-600 mt-6">🛑 Election has ended. Voting is closed.</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4 text-center">🗳️ Cast Your Vote</h2>

      {error && (
        <div className="bg-red-100 text-red-600 border border-red-400 p-2 mb-4 rounded text-center text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 text-green-700 border border-green-400 p-2 mb-4 rounded text-center text-sm">
          {success}
        </div>
      )}

      {candidates.map(({ id, name, voteCount }) => (
        <div key={id} className="mb-4 relative">
          <div className="flex justify-between items-center bg-gray-100 p-3 rounded shadow">
            <span className="font-medium">{name}</span>
            <span className="text-gray-700">{voteCount} votes</span>
            <button
              onClick={() => handleVote(id)}
              disabled={votingCandidateId === id}
              className="ml-4 px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
            >
              {votingCandidateId === id ? 'Voting...' : <FaVoteYea />}
            </button>
          </div>
          <div className="absolute top-1/2 right-5">
            <Confetti active={confettiState[id] || false} config={confettiConfig} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default Vote;
