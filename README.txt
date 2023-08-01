A multi-player Othello game in React

Allows users to register and sign in with an Oauth 2.0 password grant
server. Uses a game server to play Othello games. All of the logic is in place to
create games and to play them competitively to completion. It is currently possible
to play against yourself for testing purposes.

The Oauth 2.0 server is in repo "ou_oauth".
The game server is in "bsi_server".
Additionally either a PostgreSQL or MySQL server is required for ou_oauth, and a
MongoDB server is required for bsi_server.

Running locally is done using

    npm run start

Running on a website is done by Running

    npm run build

and copying the build folder to the website. Rename the build folder to "bsi".

To run locally a .env.development file is required in each of the three components
(ou_oauth2, bsi_server and bsi).
To run on a website a simlar .env.production file is required, with real URLs and
real certificate paths.
There is an example .env file which can be duplicated and adapted for the
development and production files.
It can be run over HTTP without certificates if you wish.
