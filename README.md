# Check your DCC
This program compares the digital COVID certificate with a set of rules and shows whether the certificate is valid and for how long. The program allows you to scan the QR code of the certificate and also manually select the type of certificate (vaccination, recovery and testing) and the date of the event (vaccination, NAA and RAT testing).

Scanning and processing the QR code of the digital certificate is intended exclusively for personal use. The program processes all the data on the device itself and does not send the data anywhere. The source code is published on the gitHub of Sledilnik. The program does not store any personal data. The only cookie used is that the device remembers that the user is aware of the terms of use.

# Rules
[SI rules](https://github.com/darkojelen/dcp/blob/master/src/resources/rules-SI.json)

[NL rules](https://github.com/darkojelen/dcp/blob/master/src/resources/rules-NL.json)
    
# To run locally:

    $ git clone https://github.com/darkojelen/dcp.git
    $ npm install
    $ npm run dev

# Demo:
https://darkojelen.github.io/dcp/
