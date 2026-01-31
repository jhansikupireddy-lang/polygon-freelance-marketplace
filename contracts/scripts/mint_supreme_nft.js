const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying Supreme Contributor NFT...");

    const [deployer] = await ethers.getSigners();
    const SupremeNFT = await ethers.getContractFactory("SupremeContributorNFT");
    const nft = await SupremeNFT.deploy();
    await nft.waitForDeployment();

    const nftAddress = await nft.getAddress();
    console.log("Supreme NFT deployed to:", nftAddress);

    console.log("Minting to deployer (Supreme Contributor)...");
    await (await nft.mintSupreme(deployer.address)).wait();

    console.log("✅ Minting Complete! Your legacy is now immortalized on-chain.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
