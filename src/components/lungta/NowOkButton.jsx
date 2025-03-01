import { useStore } from '@nanostores/react'
import { thankYouAccepted, hasAraToken } from '@scripts/state';
import { useState, useEffect } from 'react';
import '@styles/anim.css'

const Image = (props) => {
    const $thankYouAccepted = useStore(thankYouAccepted);
    const [localAraToken, setLocalAraToken] = useState(false);

    useEffect(() => {
      setLocalAraToken(localStorage.getItem('hasAraToken') == 'true');
    }, [])

    if ($thankYouAccepted) {
      document.getElementById("done_modal").showModal();
    }

    return (
      localAraToken || $thankYouAccepted ?
      <button 
        className='btn btn-secondary py-2 px-4 w-48 h-12' 
        onClick={() => {
          thankYouAccepted.set(false);
          hasAraToken.set(true);
          document.getElementById("done_modal").close();
          console.warn(`Actually navigate to the web page of the project to start putting the tasks`);

          window.location.replace("/lungta/act");
        }}>
        {localAraToken ? "Close" : "Now, OK!"}
      </button> : null
  );
};

export default Image;
