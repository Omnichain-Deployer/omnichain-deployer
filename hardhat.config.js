require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
const fs = require('fs');
const path = require('path');
const {extendEnvironment, subtask, extendConfig} = require('hardhat/config');
const prompt = require('prompt-sync')({sigint: true});
const chalk = require("chalk");
const { clearLastLine, clearLines } = require("./utils/lineManipulation");
const { task } = require("hardhat/config");
const execSync = require('child_process').execSync;

const gasAmount = 427000;

extendEnvironment((hre) => {
  let networks = hre.config.omnichain.networks;
  let deployer = hre.config.omnichain.deployerAccount;

  for(let i=0; i < networks.length; i++) {
    hre.config.networks[networks[i]].accounts = [deployer]
  }

});

task("generate-deployer", async (args, hre) => {
  console.log(chalk.red('Generating a deployer wallet!\n'));
  let deployer = hre.ethers.Wallet.createRandom();

  console.log(chalk.white.bgRed.bold(deployer.mnemonic.phrase), "\n");
  console.log("Take this 12 word phrase in a secure place and enter a password!\n");

  console.log("Copy the private key into hardhat.config to be used!");
  console.log(chalk.white.bgRed.bold(deployer.privateKey))
  console.log(chalk.bold("After you enter a password phrase will be deleted !"));

  let pressEnter =prompt("Did you save it the phrase (press Enter)    ");
  clearLastLine()

  let password = prompt("Enter a password: ");
  clearLines(9);

  let encryptedWallet = await deployer.encrypt(password);

  console.log(chalk.bold("Deployer wallet in encrypted it will be saved!"));

  let name = prompt("Give a name to deployer: ");

  // here should check if such name exists and not write to file on top of it
  // this might delete wallets, which is not a wanted functionality

  fs.writeFile(`./wallets/${name}.json`, encryptedWallet, 'utf8', () => {
    console.log(chalk.bold("Deployer wallet generated successfully!"));
  });
});

task("get-private-key", "Get private key of account")
  .addParam("account", "Path to account json file")
  .setAction(async (args, hre) => {

    console.log(chalk.bold("Get private key of account\n"));

    let password = prompt("Password of account: ");

    let wallet_json = fs.readFileSync( args.account);

    let wallet = hre.ethers.Wallet.fromEncryptedJsonSync(wallet_json, password);

    console.log(chalk.bold.bgRed(wallet.privateKey));

    let pressEnter =prompt("Did you save it the private key (press Enter to continue and delete logs)    ");
    clearLines(3);

    console.log(chalk.bold.red("Task completed successfully"));
    
});


task("fund-deployer", "Fund the deployer account with native tokens")
  .addParam("contractName", "Name of the contract to be deployed")
  .addOptionalVariadicPositionalParam("constructorArgs", "Constructor arguements of the contract")
  .setAction(async (args, hre) => {
    try {
      let networks = hre.config.omnichain.networks;
      let deployer = new hre.ethers.Wallet(hre.config.omnichain.deployerAccount);
      let funder = new hre.ethers.Wallet(hre.config.omnichain.funderAccount);

      // Calculate gas for deployment
      let contract = await hre.ethers.getContractFactory(args.contractName);
      let data = (await contract.getDeployTransaction(...args.constructorArgs)).data;

      const estimatedGas = await ethers.provider.estimateGas({ data: data });
      console.log("estimatedGas: ",estimatedGas);

      console.log(chalk.bold("Funding the deployer account\n"));

      for(let i=0; i < networks.length ; i++) {

        console.log(chalk.bold("-->Checking for balances on network "), chalk.bold.red(networks[i]));

        let provider = new hre.ethers.JsonRpcProvider(hre.config.networks[networks[i]].url);
        console.log("\n")

        let deployerBalance = hre.ethers.formatEther(await provider.getBalance(deployer.address));
        let funderBalance = hre.ethers.formatEther(await provider.getBalance(funder.address));


        let feeData = await provider.getFeeData();

        let gasPrice = feeData.gasPrice;
        let gasPriceCal = BigInt(gasPrice);
        let maxGas = feeData.maxFeePerGas;
        let tip = feeData.maxPriorityFeePerGas;

        let gas;

        console.log(chalk.bold.red("Gas price:  ", gasPrice.toString()));
        console.log(chalk.bold.red("Gas price cal:  ", gasPriceCal.toString()));
        console.log(chalk.bold.red("Max Gas price:  ", maxGas.toString()));
        console.log(chalk.bold.red("Tip price:  ", tip.toString()));

        let fundToSend;

        if (networks[i] === "fraxtal" || networks[i] === "fraxtalTestnet" || networks[i] === "mainnet" || networks[i] === "holesky") {
          // console.log("If part----------->");
          gas = maxGas + tip;
          console.log(chalk.bold.red("Gas price:  ", gas.toString()));

          fundToSend = hre.ethers.formatEther((gas * BigInt(estimatedGas) * BigInt(1)).toString());
        } else{
          // console.log("Else part------------->");
          gas = maxGas + tip;
          console.log(chalk.bold.red("Gas price:  ", gas.toString()));

          fundToSend = hre.ethers.formatEther((gas * BigInt(estimatedGas) * BigInt(2)).toString());
        }
        
        

        console.log(chalk.bold("Required amount of native tokens to deploy contract:  "), chalk.bold.red(fundToSend));

        if(deployerBalance >= fundToSend) {
          console.log("Balance for deployer address: ", chalk.bold(deployer.address), " ", chalk.bold.red(deployerBalance));

          console.log(chalk.bold.red("Deployer has enough amount of tokens passing to next network\n"));
        } else {
          console.log("Balance for deployer address: ", chalk.bold(deployer.address), " ", chalk.bold.red(deployerBalance));

          console.log("Balance for funder address:  ", chalk.bold(funder.address), " ", chalk.bold.red(funderBalance),"\n");

          let ifFund = prompt("Fund the deployer address (press Y and enter to continue)  ");

          if(ifFund.toLowerCase() === "y") {
            // fund the address
            let funderConnected = funder.connect(provider);

            let tx = {
              to: deployer.address,
              value: hre.ethers.parseEther(fundToSend.toString())
            }

            let res = await funderConnected.sendTransaction(tx);

            console.log("Tx hash to fund deployer ", chalk.bold(res.hash), "on network  ", chalk.bold.red(networks[i]));

            console.log(chalk.bold.red("Tx sent for funding the deployer passing to next network\n"));
          }
        }
      }

      console.log(chalk.bold.red("Funding phase is completed continue with deploying"));
    } catch(err) {
      console.log(err);
      return;
    }
  }
);

task("check-balances", "Check balances of deployer and funder on wanted chains")
  .setAction(async (args, hre) => {
    try {
      let networks = hre.config.omnichain.networks;
      let deployer = new hre.ethers.Wallet(hre.config.omnichain.deployerAccount);
      let funder = new hre.ethers.Wallet(hre.config.omnichain.funderAccount);

      let funded = true;

      console.log(chalk.bold("Checking balances\n"));

      for(let i=0; i < networks.length ; i++) {

        console.log(chalk.bold("-->Checking for balances on network "), chalk.bold.red(networks[i]));

        let provider = new hre.ethers.JsonRpcProvider(hre.config.networks[networks[i]].url);

        let deployerBalance = hre.ethers.formatEther(await provider.getBalance(deployer.address));
        let funderBalance = hre.ethers.formatEther(await provider.getBalance(funder.address));

        let gas =  (await provider.getFeeData()).gasPrice;

        let fundToSend = hre.ethers.formatEther((gas * BigInt(gasAmount)).toString());

        console.log("Balance for deployer address: ", chalk.bold(deployer.address), " ", chalk.bold.blue(deployerBalance));

        console.log("Balance for funder address:  ", chalk.bold(funder.address), " ", chalk.bold.red(funderBalance),"\n");

        console.log(chalk.bold("Required amount of native tokens to deploy contract:  "), chalk.bold.red(fundToSend));

        if(deployerBalance >= fundToSend) {
          console.log(chalk.bold.red("Deployer has enough amount of funds"));
        } else {
          console.log(chalk.bold.red("Deployer does not have enough amount of tokens, fund it!\n\n"));
          funded = false;
        }
      }

      return funded;
    } catch(err) {
      console.log(err);
      return false;
    }
  });

task("omnichain-deploy", "Deploy smart contracts to all L2 chains")
  .addParam("path", "Path to deploy script")
  .setAction(async (args, hre) => {
    let balancesRes = await hre.run("check-balances");

    if(!balancesRes) {
      return;
    }

    console.log(chalk.bold("-->Deployment phase"));

    let networks = hre.config.omnichain.networks;

    for(let i=0; i < networks.length; i++) {
      console.log("Deploying for network: ", chalk.bold.red(networks[i]));
      console.log("Deployment script logs");
      console.log("-->");
      console.log("-->\n\n");
      hre.hardhatArguments.network = networks[i];
      await hre.run("run", { script: args.path });

      console.log("\n\n");
      console.log(chalk.bold.red("Deployed successfully to ", networks[i]));
      console.log(chalk.bold.red("\nPassing to next network"));
    }
    
  })

task("omnichain-verify", "Verify contracts on deployed networks")
  .addParam("address", "Address of the deployed contract")
  .addOptionalVariadicPositionalParam("constructorArgs", "Constructor arguments of the contract")
  .setAction(async (args, hre) => {
    let networks = hre.config.omnichain.networks;

    for(let i=0; i < networks.length; i++) {
      console.log("Verifying for network: ", chalk.bold.red(networks[i]));
      console.log("-->");
      console.log("-->\n\n");
      hre.hardhatArguments.network = networks[i];

      let res = execSync(`npx hardhat verify --network ${networks[i]} ${args.address} ${args.constructorArgs}`);
      var enc = new TextDecoder("utf-8");

      console.log(enc.decode(res));

      console.log("\n\n");
    }
  });


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
    },
    fraxtal: {
      url: "https://rpc.frax.com", 
    },
    optimism: {
      url: "https://optimism.llamarpc.com", 
    },
    base: {
      url: "https://base.llamarpc.com", 
    },
    mode: {
      url: "https://1rpc.io/mode", 
    },
    mainnet: {
      url: "https://eth.llamarpc.com", 
    },
    fraxtalTestnet: {
      url: "https://rpc.testnet.frax.com", 
    },
    holesky: {
      url: "https://ethereum-holesky-rpc.publicnode.com", 
    },
    optimismTestnet: {
      url: "https://optimism-sepolia.blockpi.network/v1/rpc/public", 
    },
    baseTestnet: {
      url: "https://base-sepolia-rpc.publicnode.com", 
    },
    modeTestnet: {
      url: "https://sepolia.mode.network", 
    },
    sepolia: {
      url: "https://1rpc.io/sepolia", 
    },
    arbitrum: {
      url: "https://sepolia-rollup.arbitrum.io/rpc"
    },
  },
  omnichain: {
    // networks: ["fraxtalTestnet", "holesky"],
    networks: ["fraxtalTestnet", "holesky", "optimismTestnet"],
    deployerAccount: process.env.DEPLOYER_ACCOUNT,
    funderAccount: process.env.FUNDER_ACCOUNT
  },
  etherscan: {
    apiKey: {
      fraxtalTestnet: process.env.FRAXTAL_API,
      optimismTestnet: process.env.OPTIMISM_API,
      baseTestnet: process.env.BASE_API,
      modeTestnet: process.env.MODE_API,
      mainnet: process.env.MAINNET_API,
      holesky: process.env.HOLESKY_API,
      sepolia: process.env.SEPOLIA_API,
      arbitrum: process.env.ARBITRUM_API,
    },
    customChains: [
      {
        network: "fraxtal",
        chainId: 82,
        urls: {
          apiURL: "https://rpc.frax.com",
          browserURL: "https://holesky.fraxscan.com",
        },
      },
      {
        network: "optimism",
        chainId: 10,
        urls: {
          apiURL: "https://optimism.llamarpc.com",
          browserURL: "https://optimistic.etherscan.io",
        },
      },
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://base.llamarpc.com",
          browserURL: "https://basescan.org",
        },
      },
      {
        network: "mode",
        chainId: 34443,
        urls: {
          apiURL: "https://1rpc.io/mode",
          browserURL: "https://explorer.mode.network",
        },
      },
      {
        network: "fraxtalTestnet",
        chainId: 82,
        urls: {
          apiURL: "https://rpc.testnet.frax.com",
          browserURL: "https://holesky.fraxscan.com",
        },
      },
      {
        network: "holesky",
        chainId: 83,
        urls: {
          apiURL: "https://ethereum-holesky-rpc.publicnode.com",
          browserURL: "https://holesky.etherscan.io/",
        },
      },
      {
        network: "optimismTestnet",
        chainId: 421614,
        urls: {
          apiURL: "https://optimism-sepolia.blockpi.network/v1/rpc/public",
          browserURL: "https://optimism-sepolia.blockscout.com"
        }
      },
      {
        network: "baseTestnet",
        chainId: 84532,
        urls: {
          apiURL: "https://base-sepolia-rpc.publicnode.com",
          browserURL: "https://base-sepolia.blockscout.com",
        },
      },
      {
        network: "modeTestnet",
        chainId: 919,
        urls: {
          apiURL: "https://sepolia.mode.network",
          browserURL: "https://sepolia.explorer.mode.network",
        },
      },
      {
        network: "arbitrumTestnet",
        chainId: 421614,
        urls: {
          apiURL: "https://endpoints.omniatech.io/v1/arbitrum/sepolia/public",
          browserURL: "https://sepolia.arbiscan.io/"
        }
      },
      {
        network: "sepolia",
        chainId: 11155111,
        urls: {
          apiURL: "https://1rpc.io/sepolia",
          browserURL: "https://sepolia.etherscan.io/",
        },
      },
    ]
  },
  solidity: "0.8.19",
};

