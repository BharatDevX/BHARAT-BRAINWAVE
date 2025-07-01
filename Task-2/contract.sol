// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DonationVault {
    address public owner;
    uint256 public minimumDonation = 0.01 ether;

    struct Donor {
        string name;
        address donorAddress;
        uint256 totalDonated;
    }

    mapping(address => Donor) public donors;
    address[] public donorList;

    event DonationReceived(address indexed donor, uint256 amount, string name);
    event Withdrawn(uint256 amount, address indexed by);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can access this function");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function donate(string calldata _name) external payable {
        require(msg.value >= minimumDonation, "Donation too small");

        if (donors[msg.sender].donorAddress == address(0)) {
            donorList.push(msg.sender);
            donors[msg.sender] = Donor(_name, msg.sender, msg.value);
        } else {
            donors[msg.sender].totalDonated += msg.value;
        }

        emit DonationReceived(msg.sender, msg.value, _name);
    }

    function getVaultBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getDonor(address _addr) public view returns (string memory, uint256) {
        Donor memory d = donors[_addr];
        return (d.name, d.totalDonated);
    }

    function withdraw(uint256 _amount) public onlyOwner {
        require(address(this).balance >= _amount, "Not enough balance");
        payable(owner).transfer(_amount);

        emit Withdrawn(_amount, msg.sender);
    }

    function getAllDonors() public view returns (address[] memory) {
        return donorList;
    }
}
