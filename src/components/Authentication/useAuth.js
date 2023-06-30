//-----------------------------------------------------------------------------
// Copyright 2023 Chris Cooksey
//-----------------------------------------------------------------------------

// This is a React hook implementation that controls the flow of most
// authentication functionality: register, signin, signout, autosignin,
// and introspect (for the protected resourcee to validate tokens).
// useAuth has its own context which components can access via useAuth().
// Two state values are useful:
// isLoading:
//  -set for registration and signing in. Lets a component put up a "spinner"
// token:
//  -the access token to be passed to protected resources when requesting
//   or altering data.
// There are a LOT of console logs. The code would be a lot shorter
// without them.

import React, { useState, useContext, createContext } from 'react';

// Possible statuses:
// error: any type of communication error with the authorization server
// duplicate: user could not be registered bacause the name or email is already registered
// registered: user was successfully registered
// signedin: user entered the correct credentials on the signin page
// invalidcredentials: user entered incorrect credentials on the signin page
// invalidtoken: token expired, revoked, or otherwise not found

const authContext = createContext();

// Provider component that wraps protected components. Makes auth object
// available to any child component that calls useAuth().
export function AuthProvider({children}) {

    const auth = useAuth();
    return <authContext.Provider value={auth}>{children}</authContext.Provider>
}

// Hook for child components to get the auth object and
// re-render when it changes.
export const AuthConsumer = () => {

    return useContext(authContext);
}

// Provider hook that creates auth object and handles state
function useAuth() {

    const [isLoading, setIsLoading] = useState(false);
    const [token, setToken] = useState(null);
 
    // const history = useHistory(); -let's us see past URLs

    // Handy result printer
    // r.text().then(function(data) {
    //     console.log(data);
    // });

    function register(username, eaddress, password) {
 
        console.log('useAuth.js:useAuth:register called');
        console.log('useAuth.js:useAuth:register: input username = ', username);
        console.log('useAuth.js:useAuth:register: input eaddress = ', eaddress);
        console.log('useAuth.js:useAuth:register: input password = ', '******');

        var promise = new Promise((resolve, reject) => {
 
            setIsLoading(true);
 
            fetch('http://localhost:9443/auth/register', {
                method: 'POST',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    'client_id': 'bsi',
                    'grant_type': 'password',
                    'username': username,
                    'eaddress': eaddress,
                    'password': password,
                    'client_secret': null,
                })
            })
            .then((r) => {
                // Example r:
                // {type: 'cors', url: 'http://localhost:9443/auth/register', redirected: false, status: 200, ok: true, …}
                // {type: 'cors', url: 'http://localhost:9443/auth/register', redirected: false, status: 400, ok: false, …}

                console.log('useAuth.js:useAuth:register:callback called');
                console.log('useAuth.js:useAuth:register:callback: input r = ', r);

                setIsLoading(false);

                if (r.ok) {
                    console.log('useAuth.js:useAuth:register:callback Authorization server responded.');
                    r.json()
                    .then((result) => {
                        // Example result:
                        // {'message': 'registered', 'error': null}
                        // {'message': 'duplicate', 'error': null}
                        console.log('useAuth.js:useAuth:register:callback: Authorization server message: ', result.message);
                        console.log('useAuth.js:useAuth:register:callback: Authorization server error: ', result.error);
                        resolve({status: result.message});
                    })
                    .catch(() => {
                        console.log('useAuth.js:useAuth:register:callback: Authorization server response not parseable.');
                        reject({status: 'error', response: {message: 'Authorization server returned unexpected data.'}});
                   });
                } else {
                    console.log('useAuth.js:useAuth:register:callback: Authorization server error.');
                    reject({status: 'error', response: {message: 'Authorization server could not register new user.'}});
                }
            })
            .catch(() => {
                console.log('useAuth.js:useAuth:register:callback: Registration failed. Unable to contact authorization server.');
                setIsLoading(false);
                reject({status: 'error', response: {message: 'Authorization server could not be reached.'}});
            });
        });
    
        return promise;
    }

    function signin(username, password) {

        console.log('useAuth.js:useAuth:signin called');
        console.log('useAuth.js:useAuth:signin: input username = ', username);
        console.log('useAuth.js:useAuth:signin: input password = ', '******');

        var promise = new Promise((resolve, reject) => {
 
            setIsLoading(true);
 
            fetch('http://localhost:9443/auth/token', {
                method: 'POST',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    'client_id': 'bsi',
                    'grant_type': 'password',
                    'username': username,
                    'password': password,
                    'client_secret': null,
                })
            })
            .then((r) => {
                // Example r:
                // success: {type: 'cors', url: 'http://localhost:9443/auth/signin', redirected: false, status: 200, ok: false, …}
                // failure: {type: 'cors', url: 'http://localhost:9443/auth/signin', redirected: false, status: 500, ok: false, …}

                console.log('useAuth.js:useAuth:signin:callback called');
                console.log('useAuth.js:useAuth:signin:callback: input r = ', r);

                setIsLoading(false);

                if (r.ok) {
                    console.log('useAuth.js:useAuth:signin:callback: Authorization server responded.');
                    r.json()
                    .then((token) => {
                        // Example result:
                        // {token_type: 'bearer', access_token: 'f024003bc4177fce4d865ed66f79637d489d88c5', expires_in: 3600}}
                        console.log('useAuth.js:useAuth:signin:callback: token = ', token);
                        setToken(token);
                        resolve({status: 'signedin'});
                    })
                    .catch(() => {
                        console.log('useAuth.js:useAuth:signin:callback: Authorization server response not parseable.');
                        reject({status: 'error', response: {message: 'Authorization server returned unexpected data.'}});
                    });
                } else {
                    // Note r.json() here will fail -OAuth 2.0 returns an HTML response.
                    // This is different from register in that even though everything worked, if the 
                    // credentials are wrong, Oauth gives us a 500 error not a 200 success. So check
                    // for 500 specifically, otherwise just flag up a general error.
                    if (r.status === 500) {
                        console.log('useAuth.js:useAuth:signin:callback: Signin failed. Invalid credentials.');
                        reject({status: 'invalidcredentials', response: {message: 'Authorization server did not accept credentials.'}});
                    } else {
                        console.log('useAuth.js:useAuth:register:callback: Authorization server error.');
                        reject({status: 'error', response: {message: 'Authorization server could not sign user in.'}});
                    }
               }
            })
            .catch(() => {
                console.log('useAuth.js:useAuth:signin:callback:Signin failed. Unable to contact authorization server.');
                setIsLoading(false);
                reject({status: 'error', response: {message: 'Authorization server could not be reached'}});
            });
        });
    
        return promise;
    }

    // This is not implemented. It's a copy of another function. It does not work
    // nor is it even called anywhere yet.
    function autoSignin() {

        console.log('useAuth.js:useAuth:autoSignin called');

        var promise = new Promise((resolve, reject) => {

            setIsLoading(true);

            fetch('http://localhost:9443/auth/me', {
                method: 'POST',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            })
            .then((r) => {
                // Example r:
                // {}

                console.log('useAuth.js:useAuth:autoSignin:callback called');
                console.log('useAuth.js:useAuth:autoSignin:callback: input r = ', r);

                setIsLoading(false);
                
                if (r.ok) {
                    console.log('useAuth.js:useAuth:autoSignin:callback: Authorization server responded.');
                    r.json()
                    .then((token) => {
                        // Example result:
                        // {token_type: 'bearer', access_token: 'f024003bc4177fce4d865ed66f79637d489d88c5', expires_in: 3600}}
                        console.log('useAuth.js:useAuth:autoSignin:callback: token = ', token);
                        setToken(token);
                        resolve({status: 'signedin'});
                    })
                    .catch(() => {
                        console.log('useAuth.js:useAuth:autoSignin:callback: Result not parseable.');
                        reject({status: 'error', response: {message: 'Authorization server returned unexpected data'}});
                    });
                } else {
                    // Example r:
                    // {type: 'cors', url: 'http://localhost:9443/auth/signin', redirected: false, status: 500, ok: false, …}
                    // Note r.json() here will fail -OAuth 2.0 returns an HTML response.
                    if (r.status === 500) {
                        console.log('useAuth.js:useAuth:signin:callback: Signin failed. Invalid token.');
                        reject({status: 'error', response: {message: 'Invalid or expired token'}});
                    } else {
                        console.log('useAuth.js:useAuth:register:callback: Authorization server error.');
                        reject({status: 'error', response: {message: 'Authorization server could not auto-sign user in'}});
                    }
                }
            })
            .catch(() => {
                console.log('useAuth.js:useAuth:autoSignin:callback:Signin failed. Unable to contact authorization server.');
                setIsLoading(false);
                reject({status: 'error', response: {message: 'Authorization server could not be reached'}});
           });
        });
    
        return promise;
    }

    // Delete the token we have been using both locally and from the
    // authorization database. Even if we fail to delete it from the
    // database, we will still delete it locally.
    function signout() {
 
        console.log('useAuth.js:useAuth:signout called');
    
        var promise = new Promise((resolve, reject) => {
 
            setIsLoading(true);
            
            fetch('http://localhost:9443/auth/token/revoke', {
                method: 'DELETE',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    'client_id': 'bsi',
                    'grant_type': 'password',
                    'token': token.access_token,
                    'client_secret': null,
                })
            })
            .then((r) => {
                // Example r:
                // {type: 'cors', url: 'http://localhost:9443/auth/logout', redirected: false, status: 200, ok: true, …}

                console.log('useAuth.js:useAuth:signout:callback called');
                console.log('useAuth.js:useAuth:signout:callback: input r = ', r);

                setIsLoading(false);

                if (r.ok) {
                    console.log('useAuth.js:useAuth:signout:callback: Authorization server responded.');
                    r.json()
                    .then((result) => {
                        // Example result:
                        // {message: 'revoked', error: null}
                        console.log('useAuth.js:useAuth:signout:callback: result = ', result);
                        setToken(null);
                        resolve({status: 'signedout'});
                     })
                    .catch(() => {
                        console.log('useAuth.js:useAuth:signout:callback: Result not parseable.');
                        setToken(null);
                        reject({status: 'error', response: {message: 'Authorization server returned unexpected data'}});
                    });
                } else {
                    // Example r:
                    // {type: 'cors', url: 'http://localhost:9443/auth/logout', redirected: false, status: 400, ok: false, …}
                    console.log('useAuth.js:useAuth:signout:callback: Signout failed. Invalid token');
                    setToken(null);
                    reject({status: 'error', response: {message: 'Authorization server could not find token.'}});
                }
            })
            .catch(() => {
                console.log('useAuth.js:useAuth:signout:callback:Signout failed. Unable to contact authorization server.');
                setIsLoading(false);
                setToken(null);
                reject({status: 'error', response: {message: 'Authorization server could not be reached'}});
            });
        });

        return promise;
    }

    // Introspect the specified token. The loading property is not set here
    // because this function is only called from a server, or during rendering in
    // Introspection test page (and you can't change state during a render).

    function introspect() {
 
        console.log('useAuth.js:useAuth:introspect called');
    
        var promise = new Promise((resolve, reject) => {
 
            // I am not sure why, but GET does not work. It does from
            // Postman, but not from express. Changed to POST for now.
            fetch('http://localhost:9443/auth/token/introspect', {
                method: 'POST',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    'client_id': 'bsi',
                    'grant_type': 'password',
                    'token': token.access_token,
                    'client_secret': null,
                })
            })
            .then((r) => {
                // Example r:
                // {type: 'cors', url: 'http://localhost:9443/auth/logout', redirected: false, status: 200, ok: true, …}

                console.log('useAuth.js:useAuth:introspect:callback called');
                console.log('useAuth.js:useAuth:introspect:callback: input r = ', r);

                if (r.ok) {
                    console.log('useAuth.js:useAuth:introspect:callback: Authorization server responded.');
                    r.json()
                    .then((result) => {
                        // Example result:
                        // {message: 'revoked', error: null}
                        console.log('useAuth.js:useAuth:introspect:callback: result.response = ', result.response);
                        resolve({status: 'introspected', response: result.response,});
                     })
                    .catch(() => {
                        console.log('useAuth.js:useAuth:introspect:callback: Result not parseable.');
                        reject({status: 'error', response: {message: 'Authorization server returned unexpected data'}});
                    });
                } else {
                    // Example r:
                    // {type: 'cors', url: 'http://localhost:9443/auth/logout', redirected: false, status: 400, ok: false, …}
                    console.log('useAuth.js:useAuth:introspect:callback: introspect failed. Invalid token');
                    reject({status: 'error', response: {message: 'Authorization server could not find token'}});
                }
            })
            .catch(() => {
                console.log('useAuth.js:useAuth:introspect:callback:introspect failed. Unable to contact authorization server.');
                reject({status: 'error', response: {message: 'Authorization server could not be reached'}});
            });
        });

        return promise;
    }

    
    // Return the user object and auth methods
    return {
        isLoading,
        token,
        register,
        signin,
        autoSignin,
        signout,
        introspect,
    };
}
