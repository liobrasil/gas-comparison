import { expect } from 'chai';
import { compareGasEstimates } from '../src/comparator.js';

describe('Gas Estimation Tests', () => {
    const testCases = [
        {
            name: "Simple Transfer",
            tx: {
                to: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                data: "0x"
            }
        },
        {
            name: "ERC20 Transfer",
            tx: {
                to: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
                data: "0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e0000000000000000000000000000000000000000000000000de0b6b3a7640000"
            }
        }
    ];

    testCases.forEach((testCase) => {
        it(`should compare gas estimates for ${testCase.name}`, async () => {
            const result = await compareGasEstimates(testCase.tx);
            
            expect(result).to.have.property('estimateGas');
            expect(result).to.have.property('traceGas');
            expect(result).to.have.property('difference');
            expect(result).to.have.property('percentageDifference');
            expect(result).to.have.property('isEstimateHigher');
        });
    });
});