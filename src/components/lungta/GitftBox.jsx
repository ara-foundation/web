import { useStore } from '@nanostores/react'
import { giftClaimed, thankYouAccepted } from '@scripts/state';
import '@styles/anim.css'
import { useEffect, useState } from 'react';

const styles = {
  ImageContainer: {
    width: '100px',
    height: '100px',
    backgroundImage: 'url(./image.png)',
    backgroundPosition: 'center center',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
  },
};

const url = '/assets/GiftBox.png';

const defaultProps = {
  image: url
}

const Image = (props) => {
    const $giftClaimed = useStore(giftClaimed);
    const $thankYouAccepted = useStore(thankYouAccepted);
    const [localAraToken, setLocalAraToken] = useState(false);

    useEffect(() => {
      setLocalAraToken(localStorage.getItem('hasAraToken') == 'true');
    }, [])

    return (
        localAraToken || $thankYouAccepted ? null :
        <button onClick={() => giftClaimed.set(!$giftClaimed)}>
            <img src={url} className='gelatine' style={{
        ...styles.ImageContainer,
        backgroundImage: `url(${props.image ?? defaultProps.image})`,
        }} />
        </button>
  );
};

export default Image;
