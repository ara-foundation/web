import { useStore } from '@nanostores/react';
import { giftClaimed } from '@scripts/state';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fab, faLinkedin, faYoutube, faGithub } from '@fortawesome/free-brands-svg-icons'

library.add(fab, faLinkedin, faYoutube, faGithub)

const styles = {
  ImageContainer: {
    position: 'relative',
    width: '306px',
    height: '526px',
    backgroundImage: `url(/assets/users/ahmetson/v_for_victory.png)`,
    backgroundPosition: 'center center',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
  },
  Card: {
    top: '975px',
    left: '13px',
    width: '471px',
    height: '83px',
    backgroundColor: '#631471',
    color: '#ffffff'
  },
  Text: {
    color: '#ffffff',
    fontFamily: 'Open Sans',
    fontWeight: 700,
  },
};

// const element = 

const socials = [
    {
        icon: <FontAwesomeIcon icon={['fab', 'youtube']} size='lg' />,
        url: 'https://youtube.com/@medet-ahmetson',
    },
    {
        icon: <FontAwesomeIcon icon={['fab', 'github']} size='lg' />,
        url: 'https://github.com/ahmetson',
    },
    {
        icon: <FontAwesomeIcon icon={['fab', 'linkedin']} size='lg' />,
        url: 'https://linkedin.com/in/ahmetson',
    },
]

const Image = (props) => {
    const $giftClaimed = useStore(giftClaimed);

    return ($giftClaimed && 
        <div className='z-1000 absolute bottom-0 left-0'>
            <div style={styles.ImageContainer} className='left-20' />
            <div style={styles.Card}>
                <p style={styles.Text} className='inline-block mt-2 ml-4 float-left text-lg'>
                    Medet Ahmetson <br />
                    <span className='inline-block -pt-10 text-sm text-gray-300 font-normal'>CEO of Ara Foundation!</span>
                </p>
                <ul className='flex flex-row flex-stretch'>
                    {socials.map((social) => <li className='mt-6 px-4'>
                            <a href={social.url} className='mt-2 ml-4' target='_blank'>
                                {social.icon}
                            </a>
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default Image;