//-----------------------------------------------------------------------------
// Copyright 2023 Chris Cooksey
//-----------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { read_cookie } from 'sfcookies';
import { AuthConsumer } from '../Authentication/useAuth';
import '../App/AppCookieKeys';
import '../App/App.css';

// db.othello.insertOne({
//   created: new Date(),
//   players: ['ccooksey', 'dvader'],
//   colors: ['W', 'B'],
//   gameState: [
//     ['E', 'E', 'E', 'E', 'E', 'E', 'E', 'E',],
//     ['E', 'E', 'E', 'E', 'E', 'E', 'E', 'E',],
//     ['E', 'E', 'E', 'E', 'E', 'E', 'E', 'E',],
//     ['E', 'E', 'E', 'W', 'B', 'E', 'E', 'E',],
//     ['E', 'E', 'E', 'B', 'W', 'E', 'E', 'E',],
//     ['E', 'E', 'E', 'E', 'E', 'E', 'E', 'E',],
//     ['E', 'E', 'E', 'E', 'E', 'E', 'E', 'E',],
//     ['E', 'E', 'E', 'E', 'E', 'E', 'E', 'E',],
//   ],
//   next: 'ccooksey',
//   winner: '',
//   gameHistory: [],
// })

export default function Play() {

//  const navigate = useNavigate();

  const location = useLocation();
  const id = location?.state?.id;
  console.log("id is" + id);

  const [game, setGame] = useState(null);
//  const [response, setResponse] = useState('');

  const username = read_cookie(global.CookieKeys.username);
  const usercolor = game?.players[0] === username ? game?.colors[0] : game?.colors[1];

  const bsi_server = `${process.env.REACT_APP_BSI_SERVER_URL}:${process.env.REACT_APP_BSI_SERVER_PORT}`;

  const auth = AuthConsumer();

  useEffect(() => {
    if (id != null) {
      axios.get(`${bsi_server}/api/games/othello/${id}`, {
        headers: {
          'Authorization': `${auth.token.token_type} ${auth.token.access_token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      .then((res) => {
        console.log("Setting game to: ", res.data);
        setGame(res.data);
      })
      .catch((err) => {
        console.log('Could not retrieve requested game: ', err);
      });
    }
  }, [id, auth.token.token_type, auth.token.access_token, bsi_server]);

  const handleClick = (e, x, y) => {
    if (typeof e.cancelable !== "boolean" || e.cancelable) {
      e.preventDefault();
    }
    axios.post(`${bsi_server}/api/games/othello/${id}/move/`,
      { bx: x, by: y },
      { headers: {
        'Authorization': `${auth.token.token_type} ${auth.token.access_token}`,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0'
      }})
    .then((res) => {
      console.log("Setting game to: ", res.data);
      setGame(res.data);
    })
    .catch((err) => {
      console.log('Could not retrieve requested game: ', err);
    });
  }

  const renderToken = (token) => {
    if (token==='E')
      return "";
    return (
      <svg width="100%" height="100%">
        <circle cx="50%" cy="50%" r="47%" stroke="grey" strokeWidth="1"
         fill={token==='W' ? "white" : "black"} />
      </svg>
    )
  }

  return (
    <div>
      <h2>Play</h2>
      <h3>{game?.players[0]} vs {game?.players[1]}</h3>
      <table className="othelloTable">
        <tbody>
          {game?.gameState.map((rows, y) => {
            return (
              <tr key={y}>
                {rows != null && rows.map((cells, x) => {
                  return (
                    <td key={x} className="othelloCell" onClick={(e) => handleClick(e, x, y)}>
                      {renderToken(cells)}
                    </td>
                  )})
                }
              </tr>
            )}
          )}
        </tbody>
      </table>
      <p>Next: {game?.next}: {usercolor==='W' ? "White" : "Black"}</p>
      {/* <p>{response}</p> */}
    </div>
  );
}

// Note "next" logic:
// If no moves are available to either player: win(player with the most)
// If no moves available to current player: switch player