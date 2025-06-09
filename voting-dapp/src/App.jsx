import React from 'react';
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import './App.css';
import Home from './components/Home';
import Admin from './components/Admin';
import Vote from './components/Vote';
import Result from './components/Result';

function App() {
  return (
    
    <Router>
      <div className="min-h-screen bg-gray-100">
        <header className="p-6 flex justify-between items-center bg-white shadow-lg w-[98%] ml-2 rounded-lg">
          <h1 className="font-bold text-4xl font-bold bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-pink-500 text-transparent bg-clip-text">I-VOTE</h1>
          <ConnectButton />
        </header>
        <main className="p-4">
          <Routes>
            <Route path="/" element={<Home />}/>
           <Route path="/vote" element={<Vote />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/result" element={<Result />} /> 
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;