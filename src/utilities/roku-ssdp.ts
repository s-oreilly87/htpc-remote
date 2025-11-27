// import ssdp from '@achingbrain/ssdp'
//
//
//
// export default async function findRokuDevices(timeout) {
//
//     const bus = await ssdp()
//
// // print error messages to the console
//     bus.on('error', console.error)
//
//
// // this is the unique service name we are interested in:
//     const usn = 'roku:ecp'
//
//     for await (const service of bus.discover(usn)) {
//         // search for instances of a specific service
//     }
//
//     bus.on('service:discover', service => {
//         // receive a notification about discovery of a service
//         console.log(service)
//         return service
//     })
//
//     bus.on('service:update', service => {
//         // receive a notification when that service is updated - nb. this will only happen
//         // after the service max-age is reached and if the service's device description
//         // document has changed
//     })
//
// }
//
//
// // import nodeSSDP from 'node-ssdp'
// // const nodeSSDPClient = nodeSSDP.Client
// //
// // export default async function findRokuDevices(timeout) {
// //     timeout = timeout || 10000;
// //
// //     return new Promise((resolve, reject) => {
// //         const client = new nodeSSDPClient();
// //
// //         // Open the flood gates
// //         const intervalId = setInterval(() => {
// //             client.search('roku:ecp');
// //         }, 1000);
// //
// //         // Discovery timeout for roku device; default 10000ms
// //         const timeoutId = setTimeout(() => {
// //             clearInterval(intervalId);
// //             clearTimeout(timeoutId);
// //
// //             return reject(new Error(`Could not find any Roku devices. Time spent: ${timeout / 1000} seconds`));
// //         }, timeout);
// //
// //         client.on('response', headers => {
// //             if (self.debug) {
// //                 return;
// //             }
// //
// //             // Roku devices operate on PORT 8060
// //             const ipAddress = /(\d+.*:8060)(?=\/)/.exec(headers.LOCATION);
// //
// //             if ('SERVER' in headers && Boolean(~headers.SERVER.search(/Roku/)) && ipAddress) {
// //                 clearInterval(intervalId);
// //                 clearTimeout(timeoutId);
// //
// //                 return resolve(ipAddress);
// //             }
// //         });
// //     });
// // };
