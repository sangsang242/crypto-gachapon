const path = require('path');
const fs = require('fs');
const solc = require('solc');

module.exports = function (contractName) {
    const CONTRACT_PATH = __dirname + '../../../contract';
    const CONTRACT_NAME = contractName + '.sol';

    // https://levelup.gitconnected.com/compiling-ethereum-smart-contracts-locally-0-5-2-0-5-x-ebfea0aed3a9

    // Functions

    /**
     * Returns and Object describing what to compile and what need to be returned.
     */
    function createConfiguration() {
        return {
            language: 'Solidity',
            sources: {
                contract: {
                    content: fs.readFileSync(path.resolve(CONTRACT_PATH, CONTRACT_NAME), 'utf8')
                }
            },
            settings: {
                outputSelection: { // return everything
                    '*': {
                        '*': ['*']
                    }
                }
            }
        };
    }

    /**
     * Compiles the sources, defined in the config object with solc-js.
     * @param config - Configuration object.
     * @returns {any} - Object with compiled sources and errors object.
     */
    function compileSources(config) {
        try {
            return JSON.parse(solc.compile(JSON.stringify(config)));
        } catch (e) {
            console.log(e);
        }
    }

    const config = createConfiguration();
    const compiled = compileSources(config);

    return compiled.contracts.contract[contractName].abi;
};
