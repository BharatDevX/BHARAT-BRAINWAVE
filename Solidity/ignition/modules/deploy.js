const hre = require('hardhat');

async function main() {
  const signers = await hre.ethers.getSigners();
  const deployer = signers[0]; // ✅ get the first signer

  if (!deployer) {
    throw new Error("No deployer found. Check your Hardhat network/account setup.");
  }

  console.log("Deploying with account:", deployer.address); // ✅ should now work

  const VotingDapp = await hre.ethers.getContractFactory("VotingDapp", deployer);
  const contract = await VotingDapp.deploy("College CR Election");
  await contract.waitForDeployment();

  console.log("Contract deployed to:", await contract.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.log("Error deploying contracts:", err);
    process.exit(1);
  });