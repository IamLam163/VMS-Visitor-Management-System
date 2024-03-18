const calculateDiff = (signInTime) => {
    const today = new Date().getTime();
    const other = new Date(signInTime.replace(/\-/g, "/")).getTime();
    const diff = today - other;
    return Math.floor(diff / (1000 * 3600 * 24));
};

const ReceptionistSignButton = ({
    htmlFor,
    text,
    colour,
    onClick,
    key,
    signInTime,
}) => {
    return (
        <div className="float-left flex flex-wrap">
            <label
                key={key}
                className={`modal-button btn btn-sm relative inline-flex max-w-md border-0 ${colour} text-white`}
                onClick={onClick}
            >
                {text}
                {signInTime != null ? (
                    <div className="absolute -top-2 -right-2 inline-flex h-6 w-6 items-center justify-center rounded-full border-none bg-secondary text-xs font-bold text-white">
                        {calculateDiff(signInTime)}
                    </div>
                ) : (
                    <div></div>
                )}
            </label>
        </div>
    );
};
{
    /**    
function ReceptionistDashboard() {
    const [signIn, { data, loading, error }] = useMutation(SIGN_IN_MUTATION);
  
    const handleSignIn = async (invitationID, notes, signInTime) => {
      try {
        const { data } = await signIn({ variables: { invitationID, notes, signInTime } });
        console.log(`Signed in visitor with tray ID ${data.signIn.trayID}`);
      } catch (error) {
        console.error('Error signing in visitor:', error);
      }
    };
  
    return (
      <div>
        <ReceptionistSignButton
          htmlFor="signInButton"
          text="Sign In"
          colour="green"
          onClick={() => handleSignIn('invitationID', 'notes', 'signInTime')}
          key="signInButton"
          signInTime={null}
        />
      </div>
    );
  }
   */
}
export default ReceptionistSignButton;
