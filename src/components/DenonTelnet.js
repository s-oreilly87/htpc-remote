import {DENON_IP} from "@/utilities/constants.js";
import net from 'net';
import Telnet from 'telnet-stream';
import {useEffect, useState} from "react";

const port = 23
const DenonTelnet = (props) => {

    const [response, setResponse] = useState(null)

    // On Mount, open connection
    useEffect(() => {
        const socket = net.createConnection({ host: DENON_IP, port: port });

        const telnet = new Telnet();
        socket.pipe(telnet).pipe(socket);

        telnet.on('data', (data) => {
            const response = data.toString();
            setResponse(response);
        });

        telnet.on('do', (option) => {
            console.log(`Telnet option DO ${option}`);
        });

        telnet.on('will', (option) => {
            console.log(`Telnet option WILL ${option}`);
        });

        socket.on('connect', () => {
            console.log('Connected to Denon AVR via Telnet');
            //telnet.write('ZMON\r');
        });

        socket.on('close', () => {
            console.log('Disconnected from Denon AVR via Telnet');
        });

        socket.on('error', (error) => {
            console.error(error);
        });

        return () => {
            socket.end()
        }
    }, [])

    // when response changes, do some shit
    useEffect(() => {
        console.log(`Response received: ${response}`)
    }, [response])

    return (
        <div className={"absolute left-1/3 top-1/3"}>
            <p>Response: {response}</p>
        </div>
    );
}


export default DenonTelnet;