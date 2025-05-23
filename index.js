const dgram=require('node:dgram');
const dnsPacket=require('dns-packet')

const server=dgram.createSocket('udp4');

const db={ // like a dummy database present in dns
    'google.com':{
        type:'A',
        data:"1.2.3.4"
    },
    'facebook.com':{
        type:'CNAME',
        data:'pranetha.ismad'
    }   
}

server.on('message',(msg,remoteInfo)=>{
    const incomingReq=dnsPacket.decode(msg) //msg is coming in binary format , thats why decoder is used
    const ipFromdb=db[incomingReq.questions[0].name]

    if(ipFromdb)
    {
        // preparing the answer to be sent to the query
        const ans=dnsPacket.encode({
            type:'response', // since this a response t the query
            id:incomingReq.id, // id of the answer should be same as the id of the query
            flags:dnsPacket.AUTHORITATIVE_ANSWER , //since this is the actual final answer(the ip address of google which is queried) , and no more recursive resolving
            questions:incomingReq.questions, // pass the questions which were asked in the incoming request
            answers:[{ // answer must be of type array
                type:ipFromdb.type,
                class:'IN',
                name:incomingReq.questions[0].name,
                data:ipFromdb.data
            }]
        })

        // sending the answer ,to the same place(the port and the address) from which the query came from
        server.send(ans,remoteInfo.port,remoteInfo.address);
    }

    // console.log({
    //     questions:incomingReq.questions,     
    //     rinfo:remoteInfo   // rinfo is the info of the client and its request
    // })
})


//listening to queries or messages on this port
server.bind(5353,()=>{console.log("DNS server running on port 5353")})

// making a dns query...
// dig @localhost -p 5353 google.com
// if the port was on 53 , which is the one by defaut , it would have been just... dig @localhost google.com....but for some reason 53 was not working

// the response would seem something like this...

//pranetha@LAPTOP-J19OC0TK:~/my_dns$ dig @localhost -p 5353 google.com

// ; <<>> DiG 9.18.30-0ubuntu0.22.04.2-Ubuntu <<>> @localhost -p 5353 google.com
// ; (1 server found)
// ;; global options: +cmd
// ;; Got answer:
// ;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 41331
// ;; flags: qr aa; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 0

// ;; QUESTION SECTION:
// ;google.com.                    IN      A

// ;; ANSWER SECTION:
// google.com.             0       IN      A       1.2.3.4

// ;; Query time: 0 msec
// ;; SERVER: 127.0.0.1#5353(localhost) (UDP)
// ;; WHEN: Fri May 23 22:37:57 IST 2025
// ;; MSG SIZE  rcvd: 54

// pranetha@LAPTOP-J19OC0TK:~/my_dns$ dig @localhost -p 5353 facebook.com

// ; <<>> DiG 9.18.30-0ubuntu0.22.04.2-Ubuntu <<>> @localhost -p 5353 facebook.com
// ; (1 server found)
// ;; global options: +cmd
// ;; Got answer:
// ;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 64035
// ;; flags: qr aa; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 0

// ;; QUESTION SECTION:
// ;facebook.com.                  IN      A

// ;; ANSWER SECTION:
// facebook.com.           0       IN      CNAME   pranetha.ismad.

// ;; Query time: 0 msec
// ;; SERVER: 127.0.0.1#5353(localhost) (UDP)
// ;; WHEN: Fri May 23 22:38:25 IST 2025
// ;; MSG SIZE  rcvd: 70

// pranetha@LAPTOP-J19OC0TK:~/my_dns$ 



// in the case of facebook.com....i have written it as of type CNAME , which means now it will look for ip of pranetha.ismad
// if the type was of name server(NS) , then it would what are the authoritative name servers of the the website queried(here google.com or facebook.com)which would be the answer ,but then to find the IP(anycast) of these websites, dns asks these authoritative name servers to find out the ip of the website


// now if u want to host this dns and then someone wants to use my_dns....
// first of all....keep the database somewhere else...like redis...
// attach the name server of the website(should be given by the user or by the hosting company of the website) the user is looking for with the hosted ip of my_dns, to find the ip of website the user queried for
