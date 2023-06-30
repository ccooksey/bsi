My first React app!

It doesn't do much right now. It allows users to register and sign in with the
ou-oauth Oauth 2.0 password grant server also in my github account.

A complete setup requires either a PostgreSQL or MySQL server, an ou-oauth server,
and this client.

An eventual setup will also require a MongoDB server, and a protected resource server
that stores user data there (probably a simple game of some sort).

The client can just be dragged over and run, but it would be better to create
a production build using "npm run build" for efficiency's sake.
