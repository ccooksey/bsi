//-----------------------------------------------------------------------------
// Copyright 2023 Chris Cooksey
//-----------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { read_cookie } from 'sfcookies';
import { AuthConsumer } from '../Authentication/useAuth';
import '../App/AppCookieKeys';
import '../App/App.css';

// db.othello.insertOne({
//   created: new Date(),
//   players: ['hclinton', 'ccooksey'],
//   colors: ['white', 'black'],
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

export default function Dashboard() {

  const navigate = useNavigate();

  const [games, setGames] = useState(null);

  const username = read_cookie(global.CookieKeys.username);

  const auth = AuthConsumer();
  // axios.interceptors.request.use(config => {
  //   config.headers = {...config.headers,
  //     'Authorization': `${auth.token.token_type} ${auth.token.access_token}`,
  //     'Cache-Control': 'no-cache',
  //     'Pragma': 'no-cache',
  //     'Expires': '0'
  //   }
  //   console.log("headers = " + JSON.stringify(config.headers));
  //   return config;
  // });

  useEffect(() => {
    axios.get('http://localhost:8082/api/games/othello/', {
      headers: {
        'Authorization': `${auth.token.token_type} ${auth.token.access_token}`,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      params: {
        players: username,
        winner: '', // Only games with no winner yet
      }
    })
    .then((res) => {
      console.log("Setting games to: ", res.data);
      setGames(res.data);
    })
    .catch((err) => {
      console.log('Could not retrieve current games: ', err);
    });
  }, [username, auth.token.access_token, auth.token.token_type]);

  const handleClick = (e, _id) => {
    e.preventDefault();
    navigate('/play', {state: { id: _id }});
  }

  return (
    <div>
      <h2>Current Games</h2>
      <table className="currentGamesTable">
      <thead>
          <tr>
            <th className="currentGamesCell">Date</th>
            <th className="currentGamesCell">Opponent</th>
          </tr>
        </thead>
        <tbody>
          {games != null && games.map((item) => {
            return (
              <tr key={ item._id }>
                <td className="currentGamesCell">{ new Date(item.created).toLocaleString() }</td>
                <td className="currentGamesCell">{ item.players[0] !== username ? item.players[0] : item.players[1] }</td>
                <td className="currentGamesAction"><button onClick={(e) => handleClick(e, item._id)}>Resume</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
