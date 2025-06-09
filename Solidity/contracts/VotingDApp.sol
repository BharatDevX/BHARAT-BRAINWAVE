//SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract VotingDapp {
    address public admin;
    bool public electionStart;
    bool public electionEnd;
    string public electionName;

    struct Candidate {
        uint id;
        string name;
        uint voteCount;
        string party;
    }
    struct Voter {
        bool hasVoted;
        uint vote;
        string name;
    }
    mapping(uint => Candidate) public candidates;
    mapping(address => Voter) public voters;
    mapping(address => bool) public isRegistered;
    uint public candidatesCount;
    address[] public registeredVoters;
    constructor(string memory _electionName){
        admin = msg.sender;
        electionName = _electionName;
    }
    modifier onlyAdmin() {
        require(msg.sender == admin, "only admin can perform this action");
        _;
    }
    modifier duringElection(){
        require(electionStart && !electionEnd, "Election is not active");
        _;
    }
    function StartElection() public onlyAdmin{
        electionStart = true;
        electionEnd = false;
         voters[msg.sender].hasVoted = false;
    }
    function EndElection() public onlyAdmin {
        electionEnd = true;
        electionStart = false;
       
    }
    function registerVoter(address _voter) external onlyAdmin {
        require(!isRegistered[_voter], "Voter is already registered");
        isRegistered[_voter] = true;
         registeredVoters.push(_voter);

    }
    function unregisterVoter(address _voter) external onlyAdmin {
    require(isRegistered[_voter], "Not registered");
    isRegistered[_voter] = false;
    for (uint i = 0; i < registeredVoters.length; i++) {
            if (registeredVoters[i] == _voter) {
                registeredVoters[i] = registeredVoters[registeredVoters.length - 1];
                registeredVoters.pop();
                break;
            }
        }
}
function registerSelf() external {
    require(!isRegistered[msg.sender], "Already registered");
    isRegistered[msg.sender] = true;
    registeredVoters.push(msg.sender);
}

    function addCandidate(string memory _name, string memory _party) public onlyAdmin {
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0, _party);
    }
    
     function removeCandidate(uint _id) public onlyAdmin {
        require(_id > 0 && _id <= candidatesCount, "invalid id");
        // if not removing last, move last into slot _id
        if (_id <= candidatesCount) {
            Candidate storage last = candidates[candidatesCount];
            candidates[_id] = Candidate(_id, last.name, last.voteCount, last.party);
        }
        delete candidates[_id];
        candidatesCount--;
    }

    function vote(uint _candidateId) public duringElection {
          require(isRegistered[msg.sender], "Not registered to vote");
        require(!voters[msg.sender].hasVoted, "You have already voted");
        require(_candidateId > 0 && _candidateId <= candidatesCount, "you have selected invalid candidate");
        require(candidates[_candidateId].voteCount == 0 || voters[msg.sender].hasVoted == true , "You can't vote again.");
        voters[msg.sender].hasVoted = true;
        voters[msg.sender].vote = _candidateId;
        voters[msg.sender].name = candidates[_candidateId].name;
        candidates[_candidateId].voteCount++;
        
    }
     function getRegisteredVoters() external view returns (address[] memory) {
        return registeredVoters;
    }
    
   function getResult() public view returns(string memory WinnerName){
    require(electionEnd, "Election is still ongoing");
    uint winnerVoteCount = 0;
    uint winnerId;
    for(uint i = 0; i <= candidatesCount; i++){
        if(candidates[i].voteCount > winnerVoteCount){
            winnerVoteCount = candidates[i].voteCount;
            winnerId = i;
        } 
    }
     return WinnerName = candidates[winnerId].name;

   }
   function resetElection(string memory _newElectionName) public onlyAdmin {
    require(electionEnd, "Election must be ended before resetting.");
    electionName = _newElectionName;
    electionStart = false;
    electionEnd = false;
    for(uint i = 1; i <= candidatesCount; i++) {
        delete candidates[i];
    }
    candidatesCount = 0;

    
    for (uint i = 0; i < registeredVoters.length; i++) {
        address voterAddr = registeredVoters[i];
        delete isRegistered[voterAddr];
        delete voters[voterAddr];
    }
    delete registeredVoters;
}
   function getCandidate(uint _candidateId) public view returns(string memory name, uint voteCount){
    Candidate memory c = candidates[_candidateId];
    return (c.name, c.voteCount);
   }
   function getNumberOfCandidates() public view returns(uint){
    return candidatesCount;
   }

}
