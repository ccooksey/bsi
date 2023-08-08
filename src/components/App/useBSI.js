//-----------------------------------------------------------------------------
// Copyright 2023 Chris Cooksey
//-----------------------------------------------------------------------------

import React, { useEffect, useState, useContext, createContext } from 'react';
import axios from 'axios';
import useWebSocket from 'react-use-websocket';
import { AuthConsumer } from '../Authentication/useAuth';

const bsiContext = createContext();

// Provider component that wraps protected components. Makes bsi object
// available to any child component that calls useBSI().
export function BSIProvider({children}) {
    const bsi = useBSI();
    return <bsiContext.Provider value={bsi}>{children}</bsiContext.Provider>
}

// Hook for child components to get the bsi object and
// re-render when it changes.
export const BSIConsumer = () => {
    return useContext(bsiContext);
}

// Websocket protocol. This does not belong here. It should be imported from bsi_server
const typesDef = {
    AUTHORIZATION: 'authorization',
    GAME_UPDATE: 'gameUpdated',
    PLAYER_ONLINE: 'playerOnline',
    PLAYER_OFFLINE: 'playerOffline'
}

// Provider hook that creates bsi object and handles state. It handles registration
// signin, and adding token headers to the bsi server calls.
function useBSI() {

    const auth = AuthConsumer();    

    const [intercepting, setIntercepting] = useState(false);
    const [gameUpdated, setGameUpdated] = useState(0);       // Increment to signal game state changed
    const [reconnected, setReconnected] = useState(false);   // Resend authorization on reconnection

    const bsi_server = `${process.env.REACT_APP_BSI_SERVER_URL}:${process.env.REACT_APP_BSI_SERVER_PORT}`;
    const bsi_ws_server = `${process.env.REACT_APP_BSI_SERVER_WS_URL}:${process.env.REACT_APP_BSI_SERVER_PORT}`;

    const { sendJsonMessage } = useWebSocket(bsi_ws_server, {

        onOpen: () => {
            console.log('useBSI.js:useWebSocket:onOpen: connection opened.');
            setReconnected(true);
        },

        onMessage: (message) => {
            console.log('useBSI.js:useWebSocket:onMessage: message received: ' + message.data);
            const object = JSON.parse(message.data);
            if (object.type === typesDef.GAME_UPDATE) {
                setGameUpdated((gameUpdated) => gameUpdated + 1);
            }
        },

        share: true,
        // Haven't researched any of these yet:
        filter: () => false,
        retryOnError: true,
        shouldReconnect: () => true
    });

    // Add authentication token to all axios based bsi server calls.
    // Note that the interceptor needs to be ejected and renewed when the
    // token changes. It must also be ejected when the component unloads.
    useEffect(() => {

        const resInterceptor = config => {
            if (auth?.token != null && config?.headers != null) {
                config.headers = {
                ...config.headers,
                'Authorization' : `${auth.token.token_type} ${auth.token.access_token}`,
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache',
                'Expires': 0
                }
                console.log("Headers = " + JSON.stringify(config?.headers));
            }
            return config;
        }

        const errInterceptor = error => {
            return Promise.reject(error);
        }

        console.log("Injecting interceptor");
        const interceptor = axios.interceptors.request.use(resInterceptor, errInterceptor);
        setIntercepting(true);

        return () => {
            console.log("Ejecting interceptor");
            setIntercepting(false);
            axios.interceptors.request.eject(interceptor);
        }

    }, [auth.token]);

    // Listen for a valid auth token and post it to the bsi server websocket when it appears
    // Will get called twice per reconnection, but the second pass will do nothing.
    useEffect(() => {
        console.log('useBSI.js:useEffect (authorize websocket) called');
        if (auth?.token != null && sendJsonMessage && reconnected) {
            console.log('useBSI.js:useEffect: websocket sending auth token: ' + auth.token);
            sendJsonMessage({
                type: typesDef.AUTHORIZATION,
                token: `${auth.token.token_type} ${auth.token.access_token}`
            });
            setReconnected(false);
        }
    }, [auth.token, reconnected, sendJsonMessage]);

     // Listen for a valid auth token and ensure the user is in the bsi_server roster table
     // The bsi_server keeps a separate roster from the ou_oauth server.
    useEffect(() => {
        console.log('useBSI.js:useEffect (update roster) called');
        if (intercepting && auth?.token != null) {
            console.log('useBSI.js:useEffect: adding user to roster: ' + auth.token);
            axios.post(`${bsi_server}/api/roster`).catch(() => {});
        }
    }, [bsi_server, auth.token, intercepting]);

    // It's best to use an effect to establish the user's presence on login. We can
    // react to the appropriate conditions that indicate actual presence.
    useEffect(() => {
        console.log('useBSI.js:useEffect (add presence) called');
        if (intercepting && auth?.token != null) {
            console.log('useBSI.js:useEffect presence: true');
            axios.post(`${bsi_server}/api/roster/presence`, {presence: true}).catch(() => {});
        }
    }, [bsi_server, auth.token, intercepting]);

    // We'll use a hard-coded function for removing the user's presence on logout. We
    // can't just react to conditions because at that point it will be too late -the auth
    // token and or interceptor will be gone and the call to the bsi_server will be
    // rejected as unauthorized. Note that the bsi_server will also keep an eye on things.
    function removePresence() {
        console.log('useBSI.js:removePresence called');
        if (intercepting && auth?.token != null) {
            console.log('useBSI.js:removePresence presence: false');
            return axios.post(`${bsi_server}/api/roster/presence`, {presence: false});
        }
        console.log('useBSI.js:removePresence no action');
        return Promise.resolve();
    }

    // Return a promise for in-progress games for the current user (user set on game server)
    function getGames() {
        console.log('useBSI.js:useBSI:getGames called');
        return axios.get(`${bsi_server}/api/games/othello/`, {params: {winner: ''}});
    }

    // Return a promise for all visible players whether online or not
    function getRoster() {
        console.log('useBSI.js:useBSI:getRoster called');
        return axios.get(`${bsi_server}/api/roster`, {params: {visible: true}});
    }

    // Return a promise for all previous completed games for the current user (user set on game server)
    function getPreviousGames() {
        console.log('useBSI.js:useBSI:getPreviousGames called');
        return axios.get(`${bsi_server}/api/games/othello/`, {params: {winner: {'$gte': ' '}}});
    }

    // Return a promise for a specific game
    function getGame(id) {
        console.log('useBSI.js:useBSI:getGame called: id = ' + id);
        return axios.get(`${bsi_server}/api/games/othello/${id}`);
    }

    // Create a new game
    function newGame(gameParameters) {
        console.log('useBSI.js:useBSI:newGame called: gameParameters = ' + gameParameters);
        return axios.post(`${bsi_server}/api/games/othello/`, gameParameters);
    }

    // Return a makeMove promise
    function makeMove(id, {x, y}) {
        console.log('useBSI.js:useBSI:makeMove called: {x, y} = ' + {x, y});
        return axios.post(`${bsi_server}/api/games/othello/${id}/move/`, {x, y});
    }

    // Return the user object and bsi methods
    return {
        gameUpdated,
        removePresence,
        getGames,
        getRoster,
        getPreviousGames,
        getGame,
        newGame,
        makeMove,
    };
}
