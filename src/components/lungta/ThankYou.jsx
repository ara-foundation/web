import { useStore } from '@nanostores/react';
import { giftClaimed, thankYouAccepted } from '@scripts/state';
import Ceo from "@components/lungta/Ceo"

const styles = {
    GivenToken: {
        height: '92px',
        backgroundColor: '#7c174e',
        border: '1.6px solid #914e8f',
        boxSizing: 'border-box',
        color: '#ffffff',
        fontSize: '60px',
        fontFamily: 'Open Sans',
        lineHeight: '84px',
    },
  };

export default function ThankYou() {
    const $giftClaimed = useStore(giftClaimed);

    if ($giftClaimed) {
        document.getElementById("thank_you_modal").showModal();
    }

    return (
        <>
            {/* You can open the modal using document.getElementById('ID').showModal() method */}
            <dialog id="thank_you_modal" className="modal">
            <Ceo></Ceo>
            <div className="modal-box w-5/12 max-w-5xl">
                <div role="alert" className="alert alert-warning text-lg font-bold text-center flex justify-center">
                    <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 shrink-0 stroke-current"
                    fill="none"
                    viewBox="0 0 24 24">
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Thank You!</span>
                </div>
                <p className="py-4 px-4 mt-4">We are just beginning this Ara project!<br />
                    You are one of the first customers.<br />
                    As part of helping in early adoption, we gave ARA Token.
                </p>
                <div className="m-20 text-center" style={styles.GivenToken}>
                    <span>5 ARA</span>
                </div>
                <div className="modal-action justify-center">
                <form method="dialog" >
                    {/* if there is a button in form, it will close the modal */}
                    <button
                        onClick={() => {
                            thankYouAccepted.set(true);
                            giftClaimed.set(false);
                            localStorage.setItem('hasAraToken', 'true');
                        }} 
                        className="btn btn-secondary py-2 px-4 w-48 h-12"
                    >OK</button>
                </form>
                </div>
            </div>
            </dialog>
        </>
    )
}