// import { ethers } from 'ethers';
// import dotenv from 'dotenv';

// dotenv.config();

// const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

// // Helper function to measure execution time
// async function measureTime(name, fn) {
//     const start = performance.now();
//     const result = await fn();
//     const end = performance.now();
//     return {
//         name,
//         duration: end - start,
//         result
//     };
// }

// export async function compareGasEstimates(txData) {
//     try {
//         const timings = [];

//         // 1. eth_estimateGas
//         const estimateGasResult = await measureTime('eth_estimateGas', async () => 
//             await provider.estimateGas(txData)
//         );
//         timings.push(estimateGasResult);

//         // 2. callTracer
//         const originalTraceResult = await measureTime('debug_traceCall (callTracer)', async () =>
//             await provider.send("debug_traceCall", [
//                 txData,
//                 "latest",
//                 {
//                     disableStorage: true,
//                     disableStack: true,
//                     enableMemory: false,
//                     enableReturnData: false,
//                     tracer: "callTracer"
//                 }
//             ])
//         );
//         timings.push(originalTraceResult);

//         // 3. struct logger
//         const structTraceResult = await measureTime('debug_traceCall (struct logger)', async () =>
//             await provider.send("debug_traceCall", [
//                 txData,
//                 "latest",
//                 {
//                     enableMemory: true,
//                     disableStack: false,
//                     disableStorage: false,
//                     enableReturnData: true,
//                     debug: true,
//                     limit: 0
//                 }
//             ])
//         );
//         timings.push(structTraceResult);

//         // 4. prestateTracer
//         const prestateTraceResult = await measureTime('debug_traceCall (prestateTracer)', async () =>
//             await provider.send("debug_traceCall", [
//                 txData,
//                 "latest",
//                 {
//                     tracer: "prestateTracer",
//                     tracerConfig: {
//                         diffMode: false,
//                         reexec: 0,
//                         enableMemory: true,
//                         enableReturnData: true,
//                         disableStorage: false,
//                         disableStack: false,
//                         stateOverrides: null,
//                         debug: true,
//                         onlyTopCall: false,
//                         timeout: "60s"
//                     }
//                 }
//             ])
//         );
//         timings.push(prestateTraceResult);

//         // 5. detailed callTracer
//         const detailedCallResult = await measureTime('debug_traceCall (detailed callTracer)', async () =>
//             await provider.send("debug_traceCall", [
//                 txData,
//                 "latest",
//                 {
//                     tracer: "callTracer",
//                     tracerConfig: {
//                         withLog: true,
//                         onlyTopCall: false
//                     }
//                 }
//             ])
//         );
//         timings.push(detailedCallResult);

//         // Extract results from timing objects
//         const gasEstimate = estimateGasResult.result;
//         const originalTrace = originalTraceResult.result;
//         const structTrace = structTraceResult.result;
//         const prestateTrace = prestateTraceResult.result;
//         const detailedCallTrace = detailedCallResult.result;

//         // Original comparison logic
//         const traceGas = BigInt(originalTrace.gasUsed);
//         const difference = gasEstimate - traceGas;
//         const percentDiff = Number((difference * 100n) / traceGas);

//         // Gas breakdown analysis
//         const gasBreakdown = structTrace.structLogs.reduce((acc, log) => {
//             acc[log.op] = (acc[log.op] || 0) + (log.gasCost || 0);
//             return acc;
//         }, {});

//         const sortedGasOperations = Object.entries(gasBreakdown)
//             .sort(([, a], [, b]) => b - a)
//             .slice(0, 10);

//         // Sort timings by duration
//         const sortedTimings = timings.sort((a, b) => b.duration - a.duration);

//         return {
//             // Benchmark results
//             benchmarks: sortedTimings.map(t => ({
//                 name: t.name,
//                 duration: `${t.duration.toFixed(2)}ms`
//             })),

//             // Original comparison results
//             estimateGas: gasEstimate.toString(),
//             traceGas: traceGas.toString(),
//             difference: difference.toString(),
//             percentageDifference: `${percentDiff}%`,
//             isEstimateHigher: gasEstimate > traceGas,

//             // Detailed gas analysis
//             detailedAnalysis: {
//                 structTrace: {
//                     totalGas: structTrace.gas,
//                     gasBreakdown: sortedGasOperations,
//                     steps: structTrace.structLogs.length,
//                 },
//                 stateChanges: {
//                     pre: prestateTrace.pre,
//                     post: prestateTrace.post,
//                 },
//                 callTrace: {
//                     internalCalls: countInternalCalls(detailedCallTrace),
//                     gasUsedByCall: detailedCallTrace.gasUsed,
//                 },
//                 originalTrace: originalTrace
//             }
//         };
//     } catch (error) {
//         console.error("Error in detailed gas analysis:", error);
//         throw error;
//     }
// }

// // Helper function to count internal calls
// function countInternalCalls(callTrace) {
//     let count = 0;
//     function traverse(call) {
//         if (call.calls) {
//             count += call.calls.length;
//             call.calls.forEach(traverse);
//         }
//     }
//     traverse(callTrace);
//     return count;
// }

// // Helper function to format gas values
// function formatGas(gas) {
//     return typeof gas === 'string' && gas.startsWith('0x') 
//         ? BigInt(gas).toString()
//         : gas.toString();
// }