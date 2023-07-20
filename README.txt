My first React app!

It allows users to register and sign in with the Oauth 2.0 password grant
server also in my github account. It will then use the bsi_server to play Othello
games. Most of the logic is in place to create games and to play them
competitively to completion. It is currently possible to play against yourself
for testing purposes.

A complete setup requires either a PostgreSQL or MySQL server, the ou-oauth server,
a MongoDB server, the bsi_server and this client.

Running locally is done using

    npm run start

Running on a website is done by Running

    npm run build

and copying the build folder to the website. Rename the build folder to "bsi".

To run on a website requires creation of a .env.production file in each of the three
components (ou_oauth2, bsi_server and bsi), with real URLs and real certificate
paths. HTTPS is suupported but it can be run over HTTP without certificates if you wish
(which is how the development build is configured).
