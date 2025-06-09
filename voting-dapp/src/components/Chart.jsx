import React from 'react';
import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contract/index';
import { BrowserProvider, Contract } from 'ethers';
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const Chart = () => {
    const [data, setData] = useState(null);
    useEffect(() => {
        const loadChartData = async () => {
            try{
                const provider = new BrowserProvider(window.ethereum);
                const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
                const ended = await contract.electionEnd();
                if(!ended) return;
                const CandidateCount = await contract.getNumberOfCandidates();
                const labels = [];
                const votes = [];
                for(let i = 1; i <= CandidateCount; i++){
                    const [name, voteCount] = await contract.getCandidate(i);
                    labels.push(name);
                    votes.push(Number(voteCount));
                }
                setData({
                    labels,
                    datasets: [{
                        label: 'Votes',
                        data: votes,
                         backgroundColor: 'rgba(59, 130, 246, 0.6)',
                         borderColor: 'rgba(37, 99, 235, 1)',
                         borderWidth: 1,
                    },
                ],
                });

            } catch(error) {
                console.error("Error loading chart data: ", error);
            }
        };
        loadChartData();

    }, []);
    if(!data){
        return (<div className="text-center text-gray-500 mt-4">📊 Waiting for results...</div>)
    }
    
  return (
    <>
    <div className="max-w-xl mx-auto p-6 mt-6 bg-white shadow rounded">
      <h2 className="text-xl font-semibold text-center mb-4">📊 Voting Results</h2>
      <Bar
        data={data}
        options={{
          indexAxis: 'y', 
          responsive: true,
          scales: {
            x: {
              beginAtZero: true,
              ticks: {
                precision: 0,
              },
            },
          },
        }}
      />
    </div>
    </>
  );
};


export default Chart;

