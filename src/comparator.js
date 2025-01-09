import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

export async function compareGasEstimates(txData) {
    try {
        // 1. Get eth_estimateGas
        const gasEstimate = await provider.estimateGas(txData);

        // 2. Get original debug_traceCall with callTracer
        const originalTraceResult = await provider.send("debug_traceCall", [
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

        // 3. Get detailed struct logger trace
        const structTrace = await provider.send("debug_traceCall", [
            txData,
            "latest",
            {
                enableMemory: true,
                disableStack: false,
                disableStorage: false,
                enableReturnData: true,
                debug: true,
                limit: 0
            }
        ]);

        // 4. Get prestate trace
        const prestateTrace = await provider.send("debug_traceCall", [
            txData,
            "latest",
            {
                tracer: "prestateTracer",
                tracerConfig: {
                    diffMode: false,
                    reexec: 0,
                    enableMemory: true,
                    enableReturnData: true,
                    disableStorage: false,
                    disableStack: false,
                    stateOverrides: null,
                    debug: true,
                    onlyTopCall: false,
                    timeout: "60s"
                }
            }
        ]);

        // 5. Get detailed call trace
        const detailedCallTrace = await provider.send("debug_traceCall", [
            txData,
            "latest",
            {
                tracer: "callTracer",
                tracerConfig: {
                    withLog: true,
                    onlyTopCall: false
                }
            }
        ]);

        // Original comparison logic
        const traceGas = BigInt(originalTraceResult.gasUsed);
        const difference = gasEstimate - traceGas;
        const percentDiff = Number((difference * 100n) / traceGas);

        // Analyze steps from struct trace for gas usage patterns
        const gasBreakdown = structTrace.structLogs.reduce((acc, log) => {
            acc[log.op] = (acc[log.op] || 0) + (log.gasCost || 0);
            return acc;
        }, {});

        // Sort operations by gas usage
        const sortedGasOperations = Object.entries(gasBreakdown)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10); // Top 10 gas-consuming operations

        // Enhanced return object
        return {
            // Original comparison results
            estimateGas: gasEstimate.toString(),
            traceGas: traceGas.toString(),
            difference: difference.toString(),
            percentageDifference: `${percentDiff}%`,
            isEstimateHigher: gasEstimate > traceGas,

            // Detailed gas analysis
            detailedAnalysis: {
                // Struct logger analysis
                structTrace: {
                    totalGas: structTrace.gas,
                    gasBreakdown: sortedGasOperations,
                    steps: structTrace.structLogs.length,
                },

                // State changes that affected gas
                stateChanges: {
                    pre: prestateTrace.pre,
                    post: prestateTrace.post,
                },

                // Call trace analysis
                callTrace: {
                    internalCalls: countInternalCalls(detailedCallTrace),
                    gasUsedByCall: detailedCallTrace.gasUsed,
                },

                // Original trace
                originalTrace: originalTraceResult
            }
        };
    } catch (error) {
        console.error("Error in detailed gas analysis:", error);
        throw error;
    }
}

// Helper function to count internal calls
function countInternalCalls(callTrace) {
    let count = 0;
    function traverse(call) {
        if (call.calls) {
            count += call.calls.length;
            call.calls.forEach(traverse);
        }
    }
    traverse(callTrace);
    return count;
}

// Helper function to format gas values
function formatGas(gas) {
    return typeof gas === 'string' && gas.startsWith('0x') 
        ? BigInt(gas).toString()
        : gas.toString();
}

// Example usage:
// const txData = {
//     from: "0x...",
//     to: "0x...",
//     data: "0x..."
// };
// const analysis = await compareGasEstimates(txData);
// console.log(JSON.stringify(analysis, null, 2));