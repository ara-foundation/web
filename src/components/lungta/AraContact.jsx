import { useStore } from '@nanostores/react';
import { hasAraToken } from '@scripts/state';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faMessage } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';

library.add(faMessage)

const styles = {
    Card: {
        height: '58px',
        fontFamily: 'Open Sans',
        color: '#808080',
    },
};

const Image = (props) => {
    const $hasAraToken = useStore(hasAraToken);
    const [localAraToken, setLocalAraToken] = useState(false);

    useEffect(() => {
        setLocalAraToken(localStorage.getItem('hasAraToken') == 'true');
    }, [])

    const onClick = () => {
        alert("Todo coming soon...");
    }

    return (localAraToken || $hasAraToken ? 
        <div className='z-1000 absolute bottom-0 right-0'>
            <button style={styles.Card} className='hover:cursor-pointer bg-stone-100 hover:bg-fuchsia-100 text-lg px-10'
                onClick={() => onClick()} >
                <FontAwesomeIcon icon={faMessage} size='lg' color='#808080' />
                <span className='inline-block ml-3 mt-2'>Improve Ara...</span>
            </button>
        </div> : null
    );
};

export default Image;