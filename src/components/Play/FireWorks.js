import React, { useState, useEffect } from 'react';
import { Fireworks } from 'fireworks-js';

export default function FireWorks(props) {

  const [fireworks, setFireworks] = useState(null);

  useEffect(() => {
    let fw = fireworks;
    if (fw == null) {
        const container = document.querySelector('.fireworks');
        if (container != null) {
            fw = new Fireworks(container, {
                acceleration: 1.0,
                delay: {
                    min: 30,
                    max: 30
                },
                sound: {
                    enabled: true,
                    files: [
                        'https://fireworks.js.org/sounds/explosion0.mp3',
                        'https://fireworks.js.org/sounds/explosion1.mp3',
                        'https://fireworks.js.org/sounds/explosion2.mp3'
                    ],
                    volume: {
                        min: 2,
                        max: 4
                    }
                }
            })
            setFireworks(fw);
            console.log("Fireworks component mounted"); 
        }
    }
    return () => {
        if (fw != null) {
            fw.start(); // Must be running to dispose properly
            fw.stop(true);
            setFireworks(null);
            console.log("Fireworks component unmounted"); 
        }
      }
    // We don't want setFireworks() to rerender so it is deliberately
    // omitted from the dependency list. Disable the lint warning.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function fon() {
        return (
            <div className="fireworks" style={{zIndex: '100'}} >
                {fireworks?.start()}
            </div>
        )
      }
    
    function foff() {
        return (
            <div className="fireworks" style={{zIndex: '-1'}} >
                {fireworks?.stop()}
            </div>
        )
    }
    
    return (
        <div>
        {props.enabled === "true" ? fon() : foff()}
        </div>
    )
}
