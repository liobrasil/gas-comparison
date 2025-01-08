import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

export async function compareGasEstimates(txData) {
    try {
        // 1. Get eth_estimateGas
        const gasEstimate = await provider.estimateGas(txData);

        // 2. Get debug_traceCall
        const traceResult = await provider.send("debug_traceCall", [
            txData,
            "latest",
            {
                disableStorage: true,
                disableStack: true,
                enableMemory: false,
                enableReturnData: false,
                tracer: "callTracer"
            }
        ]);

        const traceGas = BigInt(traceResult.gasUsed);
        
        // Using BigInt operations instead of BigNumber methods
        const difference = gasEstimate - traceGas;
        const percentDiff = Number((difference * 100n) / traceGas);

        return {
            estimateGas: gasEstimate.toString(),
            traceGas: traceGas.toString(),
            difference: difference.toString(),
            percentageDifference: `${percentDiff}%`,
            isEstimateHigher: gasEstimate > traceGas
        };
    } catch (error) {
        console.error("Error comparing gas:", error);
        throw error;
    }
}


