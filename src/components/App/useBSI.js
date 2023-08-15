//-----------------------------------------------------------------------------
// Copyright 2023 Chris Cooksey
//-----------------------------------------------------------------------------

import React, { useEffect, useState, useContext, createContext } from 'react';
import axios from 'axios';
import useWebSocket from 'react-use-websocket';
import { AuthConsumer } from '../Authentication/useAuth';
import { wsMsgTypes } from '../../bsi_protocol';

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

// Provider hook that creates bsi object and handles state. It handles registration
// signin, and adding token headers to the bsi server calls.
function useBSI() {

    const auth = AuthConsumer();    

    const [wsConnected, setWSConnected] = useState(false);      // Websocket is connected
    const [wsAuthorized, setWSAuthorized] = useState(false);    // Websocket is authorized
    const [onlinePlayers, setOnlinePlayers] = useState([]);     // Array of online players
    const [activeGames, setActiveGames] = useState(new Map());  // Map of opponents with a game loaded
    const [gameUpdated, setGameUpdated] = useState(0);          // Increment to signal game state changed
    const [gameCreated, setGameCreated] = useState(0);          // Increment to signal a game has been created

    const bsi_server = `${process.env.REACT_APP_BSI_SERVER_URL}:${process.env.REACT_APP_BSI_SERVER_PORT}`;
    const bsi_ws_server = `${process.env.REACT_APP_BSI_SERVER_WS_URL}:${process.env.REACT_APP_BSI_SERVER_PORT}`;

    const { sendJsonMessage } = useWebSocket(bsi_ws_server, {

        onOpen: () => {
            console.log('useBSI.js:useWebSocket:onOpen: connection opened.');
            setWSConnected(true);
            setWSAuthorized(false);
            setOnlinePlayers([]);
            setActiveGames(new Map());
        },

        onClose: () => {
            console.log('useBSI.js:useWebSocket:onClose: connection closed.');
            setWSConnected(false);
            setWSAuthorized(false);
            setOnlinePlayers([]);
            setActiveGames(new Map());
        },

        onMessage: (message) => {
            console.log('useBSI.js:useWebSocket:onMessage: message received: ' + message.data);
            const object = JSON.parse(message.data);
            if (object.type === wsMsgTypes.AUTHORIZATION) {
                setWSAuthorized(object.authorized);
            } else if (object.type === wsMsgTypes.PLAYER_ONLINE) {
                if (onlinePlayers.filter(player => player === object.player).length === 0) {
                    setOnlinePlayers(players => [...players, object.player]);
                    // Potential bug: A reconnected websocket while in a game view will not
                    // resend the GAME_ACTIVE message which we deleted in the PLAYER_OFFLINE
                    // response below.
                }
            } else if (object.type === wsMsgTypes.PLAYER_OFFLINE) {
                setOnlinePlayers(players => players.filter(player => {return player !== object.player;}));
            } else if (object.type === wsMsgTypes.GAME_CREATED) {
                if (onlinePlayers.filter(player => player === object.player).length === 0) {
                    setGameCreated((gameCreated) => gameCreated + 1);
                }
            } else if (object.type === wsMsgTypes.GAME_UPDATED) {
                setGameUpdated((gameUpdated) => gameUpdated + 1);
            } else if (object.type === wsMsgTypes.GAME_ACTIVE) {
                if (activeGames.get(object.player) !== object.id) {
                    setActiveGames(new Map(activeGames.set(object.player, object.id)));
                }
            } else if (object.type === wsMsgTypes.GAME_INACTIVE) {
                if (activeGames.delete(object.player)) {
                    setActiveGames(new Map(activeGames));
                }
            }
        },

        share: true,
        // Haven't researched any of these yet:
        filter: () => false,
        retryOnError: true,
        shouldReconnect: () => true
    },
    // So cool -only tries to connect when auth?.token != null. This allows
    // us to defer connecting the socket until after the user has signed in.
    Boolean(auth?.token != null));

    // Add authentication token to all axios based bsi server calls.
    // Note that the interceptor needs to be ejected and renewed when the
    // token changes. It must also be ejected when the component unloads.
    useEffect(() => {

        const resInterceptor = (config) => {
            if (auth?.token != null && config?.headers != null) {
                config.headers = {
                ...config.headers,
                'Authorization' : `${auth.token.token_type} ${auth.token.access_token}`,
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache',
                'Expires': 0
                }
                console.log('UseBSI.js: useEffect: resInterceptor: Headers updated: ' +
                    JSON.stringify(config?.headers));
            }
            return config;
        }

        const errInterceptor = error => {
            return Promise.reject(error);
        }

        console.log('UseBSI.js: useEffect: resInterceptor: Injecting interceptor');
        const interceptor = axios.interceptors.request.use(resInterceptor, errInterceptor);

        return () => {
            console.log('UseBSI.js: useEffect: resInterceptor: Ejecting interceptor');
            axios.interceptors.request.eject(interceptor);
        }

    }, [auth?.token]);

    // Listen for a valid auth token and post it to the bsi server websocket when it
    // appears. Will get called twice per reconnection, but the second pass will do nothing.
    useEffect(() => {
        console.log('useBSI.js:useEffect (authorize websocket) called');
        if (auth?.token != null && wsConnected && sendJsonMessage != null) {
            console.log('useBSI.js:useEffect: websocket sending auth token: ' + auth.token);
            sendJsonMessage({
                type: wsMsgTypes.AUTHORIZATION,
                token: `${auth.token.token_type} ${auth.token.access_token}`
            });
            setWSConnected(false);
        }
    }, [auth?.token, wsConnected, sendJsonMessage]);

     // Listen for a valid auth token and ensure the user is in the bsi_server roster table
     // The bsi_server keeps a separate roster from the ou_oauth server.
    useEffect(() => {
        console.log('useBSI.js:useEffect (update roster) called');
        if (auth?.token != null && !auth?.signingOut.current) {
            console.log('useBSI.js:useEffect: adding user to roster: ' + auth.token);
            axios.post(`${bsi_server}/api/roster`).catch(() => {});
        }
    }, [bsi_server, auth?.token, auth?.signingOut]);

    // It is best to use an effect to establish the user's presence on login. We can
    // react to the appropriate conditions that indicate actual presence.
    useEffect(() => {
        console.log('useBSI.js:useEffect (add presence) called');
        if (auth?.token != null && !auth?.signingOut.current && wsAuthorized) {
            console.log('useBSI.js:useEffect: adding presence');
            axios.post(`${bsi_server}/api/roster/presence`, {presence: true}).catch(() => {});
        }
    }, [bsi_server, auth?.token, auth?.signingOut, wsAuthorized]);

    // We'll use a hard-coded function for removing the user's presence on logout. We
    // can't just react to conditions because at that point it will be too late -the auth
    // token and or interceptor will be gone and the call to the bsi_server will be
    // rejected as unauthorized. Note that the bsi_server will also keep an eye on things.
    function removePresence() {
        console.log('useBSI.js:removePresence called');
        if (auth?.token != null) {
            console.log('useBSI.js:removePresence: removing presence');
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

    // Return a promise to create a new game
    function newGame(gameParameters) {
        console.log('useBSI.js:useBSI:newGame called: gameParameters = ' + gameParameters);
        return axios.post(`${bsi_server}/api/games/othello/`, gameParameters);
    }

    // Return a promise to make a move
    function makeMove(id, {x, y}) {
        console.log('useBSI.js:useBSI:makeMove called: {x, y} = ' + {x, y});
        return axios.post(`${bsi_server}/api/games/othello/${id}/move/`, {x, y});
    }

    // Return the user object and bsi methods
    return {
        onlinePlayers,
        gameCreated,
        gameUpdated,
        activeGames,
        removePresence,
        getGames,
        getRoster,
        getPreviousGames,
        getGame,
        newGame,
        makeMove,
    };
}
