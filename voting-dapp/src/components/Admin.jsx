import { useState, useEffect } from 'react';
import React from 'react';
import { useAccount } from 'wagmi';
import { Route } from 'react-router-dom';
import { BrowserProvider, Contract, isAddress, ethers } from 'ethers'; // ethers properly imported
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contract/index';
import Chart from './Chart';
export default function Admin() {
  const ADMIN_ADDRESS = "0x704a60fdD7948F835465D2334c8409D76a6dCFcB";
  const { address: userAddress, isConnected } = useAccount();
  const isAdmin = isConnected && userAddress?.toLowerCase() === ADMIN_ADDRESS;
 
  // Candidate state
  const [resetState, setResetState] = useState(false);
  const [newName, setNewName] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [name, setName] = useState('');
  const [party, setParty] = useState('');
  // Election control state
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  // Registration state
  const [registered, setRegistered] = useState([]);
  
  // On-chain admin address
  const [adminAddress, setAdminAddress] = useState('');

  // read-only provider & contract
  
  const readProvider = new BrowserProvider(window.ethereum);
  const readContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, readProvider);

  // Load admin address, candidates list, and registered voters
  const loadAll = async () => {
    try {
      setError(''); 
      setMessage('');

      // 1️⃣ admin address
      const admin = await readContract.admin();
      setAdminAddress(admin.toLowerCase());

      // 2️⃣ candidates
      const count = await readContract.getNumberOfCandidates();
      const list = [];
      for (let i = 1; i <= count; i++) {
        const [n, v] = await readContract.getCandidate(i);
        list.push({ id: i, name: n, votes: Number(v) });
      }
      setCandidates(list);

      // 3️⃣ registered voters
      const regs = await readContract.getRegisteredVoters();
      setRegistered(regs);
    } catch (e) {
      console.error(e);
      setError('Failed to load contract data.');
    }
  };

  useEffect(() => {
    if (isConnected && isAdmin) loadAll();
  }, [isConnected]);
  
  // Get a signer-connected contract for writes
  const getSignerContract = async () => {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const signer = await readProvider.getSigner();
    return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  };

  // ==== Candidate Management ====
  const addCandidate = async () => {
    if (!name || !party) return setError('Enter name & party');
    try {
      const contract = await getSignerContract();
      const tx = await contract.addCandidate(name, party);
      await tx.wait();
      setMessage('✅ Candidate added');
      setName(''); 
      setParty('');
      await loadAll();
    } catch (e) {
      console.error(e);
      setError( 'Add candidate failed');
    }
  };

  const removeCandidate = async (id) => {
    try {
      const contract = await getSignerContract();
      const tx = await contract.removeCandidate(id);
      await tx.wait();
      setMessage(`✅ Removed candidate #${id}`);
      await loadAll();
    } catch (e) {
      console.error(e);
      setError('Remove candidate failed');
    }
  };

  // ==== Election Control ====
  const startElection = async () => {
    try {
      const contract = await getSignerContract();
      const tx = await contract.StartElection();
      await tx.wait();
      setMessage('✅ Election started');
      await loadAll();
    } catch (e) {
      console.error(e);
      setError('Start election failed');
    }
  };

  const endElection = async () => {
    try {
      const contract = await getSignerContract();
      const tx = await contract.EndElection();
      await tx.wait();
      setMessage('✅ Election ended');
      await loadAll();
    } catch (e) {
      console.error(e);
      setError('End election failed');
    }
  };

  // ==== Voter Registration ====
 const resetElection = async() => {
 if (!newName.trim()) {
    setMessage('Please enter a new and valid election name');
    return;
  }
  try{
    const contract = await getSignerContract();
    const tx = await contract.resetElection(newName);
    await tx.wait();
    alert(`✅ Election reset to "${newName}"`);
    setResetState(false);
    setNewName('');
    window.location.reload();
    
  } catch(err) {
     console.error(err);
      setError('Reset election failed');
  }

 }

  const unregisterVoter = async (addr) => {
    try {
      const contract = await getSignerContract();
      const tx = await contract.unregisterVoter(addr);
      await tx.wait();
      setMessage(`✅ ${addr} unregistered`);
      await loadAll();
    } catch (e) {
      console.error(e);
      setError('Unregister voter failed');
    }
  };

  // Permissions
  if (!isConnected) {
    return (<div className="text-center p-4 text-red-600">🔌 Connect your wallet to access Admin</div>)
  }
  const youAreAdmin = userAddress?.toLowerCase() === ADMIN_ADDRESS.toLowerCase();

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-[#f7f9fc] via-[#eef1f7] to-[#e4ebf5] p-6 ">
    <div className="max-w-3xl mx-auto backdrop-blur-md shadow-2xl rounded-xl p-8 space-y-6 border border-gray-200">
      <h2 className="text-3xl font-bold text-center text-gray-800">Admin Panel</h2>
      {message && <p className="text-green-600">{message}</p>}
      {error   && <p className="text-red-600">{error}</p>}

      {!youAreAdmin && (
        <p className="text-orange-600">
          ⚠️ Only admin can perform these actions.
        </p>
      )}

      {/* Add Candidate */}
      <div className="space-y-2">
        <input
          value={name}
          onChange={e => { setName(e.target.value); setMessage(''); setError(''); }}
          placeholder="Candidate Name"
          className="w-full p-2 border rounded-lg"
          disabled={!youAreAdmin}
        />
        <input
          value={party}
          onChange={e => { setParty(e.target.value); setMessage(''); setError(''); }}
          placeholder="Party"
          className="w-full p-2 border rounded-lg"
          disabled={!youAreAdmin}
        />
        <button
          onClick={addCandidate}
          disabled={!youAreAdmin}
          className={`w-full py-2 tracking-widest rounded-xl text-white ${
            youAreAdmin ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400'
          }`}
        >
          Add Candidate 
        </button>
      </div>

      {/* Start / End Election */}
      <div className="flex space-x-2">
        <button
          onClick={startElection}
          disabled={!youAreAdmin}
          className={`flex-1 py-2 rounded-xl tracking-widest text-white ${
            youAreAdmin ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400'
          }`}
        >
          Start Election
        </button>
        <button
          onClick={endElection}
          disabled={!youAreAdmin}
          className={`flex-1 py-2 rounded-xl tracking-widest text-white ${
            youAreAdmin ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400'
          }`}
        >
          End Election
        </button>
      </div>

      {/* Candidate List */}
      <div>
        <h3 className="font-semibold">Current Candidates</h3>
        {candidates.length === 0 && <p>No candidates added yet.</p>}
        {candidates.map(c => (
          <div key={c.id} className="flex justify-between items-center p-2 bg-gray-50 rounded mb-2">
            <span>{c.id}. {c.name} ({c.votes} votes)</span>
            <button
              onClick={() => removeCandidate(c.id)}
              disabled={!youAreAdmin}
              className={`px-2 py-1 rounded text-white ${
                youAreAdmin ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-400'
              }`}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={() => setResetState(true)}
        className="bg-red-600 tracking-widest text-white px-4 py-2 rounded-lg hover:bg-red-700 mt-4"
>
  🔄 Reset Election
</button>
 {resetState && (
  <div className="fixed inset-0 backdrop-blur bg-opacity-50 bg-white-500 flex items-center justify-center z-50 transition duration-300 ease-out transform scale-100 popup-animation">
    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
      <h2 className="text-xl font-semibold mb-4 text-center">Reset Election</h2>
      <input
        type="text"
        placeholder="Enter new election name"
        className="w-full border px-3 py-2 rounded mb-4"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
      />
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setResetState(false)}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
        <button
          onClick={resetElection}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Confirm Reset
        </button>
      </div>
    </div>
  </div>
)}

      {/* Voter Registration */}
      <div>
        <h3 className="mt-6 font-semibold">Voter Registration</h3>
        <div className="flex space-x-2 mb-4">
          
        </div>
        {registered.length === 0 && <p>No registered voters.</p>}
        {registered.map(addr => (
          <div key={addr} className="flex justify-between items-center p-2 bg-gray-50 rounded mb-2">
            <span>{addr}</span>
            <button
              onClick={() => unregisterVoter(addr)}
              disabled={!youAreAdmin}
              className={`px-2 py-1 rounded text-white ${
                youAreAdmin ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-400'
              }`}
            >
              Unregister
            </button>
          </div>
        ))}
      </div>
      <Chart />
    </div>
    </div>
  </>
  );
}
