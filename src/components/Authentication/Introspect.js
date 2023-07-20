//-----------------------------------------------------------------------------
// Copyright 2023 Chris Cooksey
//-----------------------------------------------------------------------------

import React, {useState} from 'react';
import { AuthConsumer } from './useAuth';

export default function Introspect() {

  // Order here is important. Must initialize auth before defining handleUpdate.
  // Must define handleUpdate before creating the response useState.
  const auth = AuthConsumer();
  
  // Used to lazily initialize the starting value of the token introspection data
  const handleUpdate = (() => {
    auth.introspect()
    .then((res) => {
      setResponse(res);
    })
    .catch(() => {
      console.log('Authorization server offline?');
    });
  });

  // Here is an identical implementation of handleUpdate using async / await.
  //
  // async function handleUpdate() {
  //   try {
  //     const res = await auth.introspect();
  //     setResponse(res);
  //   }
  //   catch(error) {
  //     console.error('Authorization server offline?');
  //   }
  // }

  // React will call handleUpdate asynchronously. Once the info is obtained
  // the response state will change, and we will get a new render.
  const [response, setResponse] = useState(handleUpdate);
  
  return(
    <div>
    <h2>Introspect</h2>
      {auth?.token !== null && <button onClick={() => handleUpdate()}>Update</button>}
      {auth?.token !== null && <pre>{JSON.stringify(response, null, 2)}</pre>}
    </div>
  );
}
