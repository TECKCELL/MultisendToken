const HDWalletProvider = require("truffle-hdwallet-provider");
require('dotenv').config();

module.exports = {
    // See <http://truffleframework.com/docs/advanced/configuration>
    // to customize your Truffle configuration!
    networks: {
        ganache: {
            host: "localhost",
            port: 7545,
            network_id: "*", // Match any network id
            gas: 4700000
        },
        rinkeby: {
            host: "localhost",
            port: 8545,
            network_id: 4, // Rinkeby test network
            gas: 4700000
        },
        live: {
            host: "localhost",
            port: 8545,
            network_id: 1, // Ethereum public network
            from: "0xfc7b752874e02816b19919f9cd288b12aff8cfa5",
            gas: 4700000
        },
        ropsten: {
            provider: function () {
                return new HDWalletProvider(process.env.MNEMONIC, "https://ropsten.infura.io/v3/" + process.env.INFURA_API_KEY);
            },
            network_id: 3,
            gas: 4500000,
            gasPrice: 10000000000
        }
    },
    compilers: {
        solc: {
            settings: {
                optimizer: {
                    enabled: true,
                    runs: 200
                }
            }
        }
    }
};
