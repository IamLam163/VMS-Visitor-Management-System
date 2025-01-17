import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { gql, useApolloClient, useLazyQuery } from "@apollo/client";
import { BiQrScan, BiLogIn, BiFace } from "react-icons/bi";
import { FaMailBulk } from "react-icons/fa";
import { BsInfoCircle } from "react-icons/bs";
import QRScanner from "../components/QRScanner";
import Layout from "../components/Layout";
import SignInPopUp from "../components/SignInPopUp";
import SignOutPopUp from "../components/SignOutPopUp";
import VisitInfoModal from "../components/VisitInfoModal";
import ReceptionistSignButton from "../components/receptionistSignButton";
import UploadPopUp from "../components/UploadPopUp";

const ReceptionistDashboard = () => {
    const client = useApolloClient();
    {
        /**    
    const handleSignIn = async (invitationID, notes, signInTime) => {
        try {
            const { data } = await signIn({
                variables: { invitationID, notes, signInTime },
            });
            console.log(`Signed in visitor with tray ID ${data.signIn.trayID}`);
        } catch (error) {
            console.error("Error signing in visitor:", error);
        }
    };
 */
    }
    const [searching, setSearch] = useState(false);
    const [searchName, setSearchName] = useState("");

    const [currentButton, setCurrentButton] = useState(() => {});
    const [currentParkingNumber, setCurrentParkingNumber] = useState(-1);
    const [visitorData, setVisitorData] = useState([]);
    const [inActiveInvites, setInactiveInvites] = useState([]);
    const [signedInInvites, setSignedInInvites] = useState([]);
    const [signedOutInvites, setSignedOutInvites] = useState([]);

    const [trayNr, setTrayNr] = useState("");

    const [showErrorAlert, setShowErrorAlert] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [showSuccessAlert, setShowSuccessAlert] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [showInfoAlert, setShowInfoAlert] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [showUploadPopUp, setShowUploadPopUp] = useState(false);
    const [showVisitorModal, setShowVisitorModal] = useState(false);
    const [showSignInModal, setShowSignInModal] = useState(false);
    const [showSignOutModal, setShowSignOutModal] = useState(false);
    const [currentVisitData, setCurrentVisitData] = useState("");

    const getFormattedDateString = (date) => {
        if (date instanceof Date) {
            const month = date.getMonth() + 1;
            const day = date.getDate();
            return [
                date.getFullYear(),
                (month > 9 ? "" : "0") + month,
                (day > 9 ? "" : "0") + day,
            ].join("-");
        }
    };

    const [todayString, setTodayString] = useState(
        getFormattedDateString(new Date())
    );

    const router = useRouter();
    const [invitesQuery, { loading, error, data }] = useLazyQuery(
        gql`
        query {
            getInvitesByDate( date: "${todayString}" ) {
                inviteID
                inviteDate
                idNumber
                visitorName
                inviteState
                idDocType
                userEmail
                signInTime
            }
        }
    `,
        { fetchPolicy: "no-cache" }
    );

    const SIGN_IN_MUTATION = gql`
        mutation SignIn(
            $invitationID: String!
            $notes: String!
            $signInTime: String!
        ) {
            signIn(
                invitationID: $invitationID
                notes: $notes
                signInTime: $signInTime
            ) {
                trayID
            }
        }
    `;

    const search = () => {
        setSearch(true);

        client
            .query({
                query: gql`
                query{
                    getInvitesByNameForSearch( name: "${searchName}" ) {
                        inviteID
                        inviteDate
                        idNumber
                        visitorName
                        inviteState
                        idDocType
                        userEmail
                    }
                }
            `,
            })
            .then((res) => {
                const inActiveInvites =
                    res.data.getInvitesByNameForSearch.filter((invite) => {
                        return (
                            invite.inviteDate === todayString &&
                            invite.inviteID &&
                            invite.inviteState === "inActive"
                        );
                    });
                setInactiveInvites(inActiveInvites);
                const signedInInvites = res.data.getInvitesByNameForSearch
                    .filter((invite) => {
                        return (
                            invite.inviteID &&
                            ((invite.inviteDate >= todayString &&
                                invite.inviteState === "signedIn") ||
                                invite.inviteState === "extended")
                        );
                    })
                    .sort((a, b) =>
                        a.inviteState == "signedIn" &&
                        b.inviteState == "extended"
                            ? -1
                            : a.inviteState == "extended" &&
                              b.inviteState == "signedIn"
                            ? 1
                            : 0
                    );
                setSignedInInvites(signedInInvites);
                const signedOutInvites =
                    res.data.getInvitesByNameForSearch.filter((invite) => {
                        return (
                            invite.inviteID &&
                            invite.inviteDate === todayString &&
                            invite.inviteState === "signedOut"
                        );
                    });
                setSignedOutInvites(signedOutInvites);
            })
            .catch((err) => {});
    };

    const resetDefaultResults = () => {
        if (!loading && !error) {
            const inActiveInvites = data.getInvitesByDate.filter((invite) => {
                return (
                    invite.inviteDate === todayString &&
                    invite.inviteID &&
                    invite.inviteState === "inActive"
                );
            });
            setInactiveInvites(inActiveInvites);
            const signedInInvites = data.getInvitesByDate
                .filter((invite) => {
                    return (
                        invite.inviteID &&
                        ((invite.inviteDate >= todayString &&
                            invite.inviteState === "signedIn") ||
                            invite.inviteState === "extended")
                    );
                })
                .sort((a, b) =>
                    a.inviteState == "signedIn" && b.inviteState == "extended"
                        ? -1
                        : a.inviteState == "extended" &&
                          b.inviteState == "signedIn"
                        ? 1
                        : 0
                );
            setSignedInInvites(signedInInvites);
            setSearch(false);
        } else if (error) {
            if (error.message === "Unauthorized") {
                router.push("/expire");
                return;
            }

            setVisitorData([
                {
                    visitorEmail: "ERROR",
                    idDocType: "ERROR",
                    isNumber: "ERROR",
                },
            ]);
        }
    };

    useEffect(() => {
        invitesQuery();
        if (!loading && !error) {
            if (data) {
                const inActiveInvites = data.getInvitesByDate.filter(
                    (invite) => {
                        return (
                            invite.inviteDate === todayString &&
                            invite.inviteID &&
                            invite.inviteState === "inActive"
                        );
                    }
                );
                setInactiveInvites(inActiveInvites);
                const signedInInvites = data.getInvitesByDate
                    .filter((invite) => {
                        return (
                            invite.inviteID &&
                            ((invite.inviteDate >= todayString &&
                                invite.inviteState === "signedIn") ||
                                invite.inviteState === "extended")
                        );
                    })
                    .sort((a, b) =>
                        a.inviteState == "signedIn" &&
                        b.inviteState == "extended"
                            ? -1
                            : a.inviteState == "extended" &&
                              b.inviteState == "signedIn"
                            ? 1
                            : 0
                    );
                setSignedInInvites(signedInInvites);
            }
        } else if (error) {
            if (error.message === "Unauthorized") {
                router.push("/expire");
                return;
            }

            setVisitorData([
                {
                    visitorID: "ERROR",
                    visitorEmail: "ERROR",
                    idDocType: "ERROR",
                    isNumber: "ERROR",
                },
            ]);
        }
    }, [loading, error, router, data, invitesQuery]);

    return (
        <Layout>
            <div className="input-group w-full p-3">
                <input
                    type="text"
                    placeholder="Search.."
                    className="input input-bordered input-sm w-full md:input-md"
                    onChange={(evt) => {
                        setSearchName(evt.target.value);
                        if (searching === true && evt.target.value === "") {
                            resetDefaultResults();
                        }
                    }}
                />
                <button
                    data-testid="searchbtn"
                    onClick={search}
                    className="btn btn-sm md:btn-md"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                </button>
            </div>

            <div className="ml-2 grid w-full grid-cols-1 pt-7 md:grid-cols-2">
                <div className="flex w-full">
                    <h1 className="base-100 text-xl font-bold md:text-3xl lg:text-4xl ">
                        {searching ? "Search Results" : "Today's Invites"}
                    </h1>
                    {searching ? (
                        <label
                            data-testid="resetsearch"
                            className="btn btn-circle btn-xs ml-2 border-none bg-error"
                            onClick={() => resetDefaultResults()}
                        >
                            ✕
                        </label>
                    ) : (
                        <div></div>
                    )}
                </div>

                <div className="mr-6 flex flex-col justify-center space-y-4 md:flex-row md:justify-end md:space-y-0 md:space-x-3">
                    <label
                        htmlFor="QRScan-modal"
                        className="modal-button btn-tertiary btn btn-sm gap-2 md:btn-md"
                        onClick={() => setShowScanner(true)}
                    >
                        <BiQrScan />
                        Scan Invite
                    </label>
                    <label
                        htmlFor="Upload-modal"
                        className="modal-button btn btn-secondary btn-sm gap-2 md:btn-md"
                        onClick={() => setShowUploadPopUp(true)}
                    >
                        <FaMailBulk />
                        Bulk-SignIn
                    </label>
                    {/* 
                    <label
                        htmlFor="signIn-modal"
                        className="modal-button btn btn-primary btn-sm gap-2 md:btn-md"
                        onClick={() => setShowSignInModal(true)}
                    >
                        <BiFace />
                        Recognize Face
                    </label>
                    */}
                </div>
            </div>

            <div
                className={`grid grid-cols-1 ${
                    searching ? " md:grid-cols-3 " : " md:grid-cols-2 "
                } mx-3 mt-5 gap-3`}
            >
                <div className="card h-fit bg-base-300 p-3">
                    <div className="flex flex-col">
                        <h2 className="ml-3 mb-3 text-xl font-bold">
                            IN-ACTIVE INVITES
                        </h2>
                        {loading ? (
                            <progress className="progress progress-primary w-56">
                                progress
                            </progress>
                        ) : inActiveInvites.length > 0 ? (
                            <div className="flex h-[30rem] flex-col gap-2 overflow-y-scroll p-2">
                                {inActiveInvites.map((visit, idx) => {
                                    return (
                                        <div
                                            className="m-1 flex cursor-pointer flex-row items-center justify-between rounded-lg bg-base-100 p-3 shadow-xl hover:bg-base-200"
                                            key={visit.inviteID}
                                            onClick={() => {
                                                setCurrentVisitData(visit);
                                                setShowVisitorModal(true);
                                            }}
                                        >
                                            <div className="flex flex-row items-center justify-center">
                                                <BsInfoCircle className="mr-5 ml-2" />

                                                <div className="flex flex-col items-start">
                                                    <div className="text-md font-bold capitalize">
                                                        {visit.visitorName}
                                                    </div>
                                                    <div className="text-sm">
                                                        {visit.idNumber}
                                                    </div>
                                                </div>
                                            </div>

                                            <ReceptionistSignButton
                                                key={visit.inviteID}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                }}
                                                text="Not Signed In"
                                                colour="bg-tertiary"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <h3 className="ml-3">Nothing to show..</h3>
                        )}
                    </div>
                </div>

                <div className="card h-fit bg-base-300 p-3">
                    <div className="flex flex-col">
                        <h2 className="ml-3 mb-3 text-xl font-bold">
                            OPEN INVITES
                        </h2>
                        {loading ? (
                            <progress className="progress progress-primary w-56">
                                progress
                            </progress>
                        ) : signedInInvites.length > 0 ? (
                            <div className="flex h-[30rem] flex-col gap-2 overflow-y-scroll p-2 ">
                                {signedInInvites.map((visit, idx) => {
                                    return (
                                        <div
                                            className="m-1 flex flex cursor-pointer flex-row items-center justify-between rounded-lg bg-base-100 p-3 shadow-xl hover:bg-base-200"
                                            key={visit.inviteID}
                                            onClick={() => {
                                                setCurrentVisitData(visit);
                                                setShowVisitorModal(true);
                                            }}
                                        >
                                            <div className="flex flex-row items-center justify-center">
                                                <BsInfoCircle className="mr-5 ml-2" />

                                                <div className="flex flex-col items-start">
                                                    <div className="text-md font-bold capitalize">
                                                        {visit.visitorName}
                                                    </div>
                                                    <div className="text-sm">
                                                        {visit.idNumber}
                                                    </div>
                                                </div>
                                            </div>

                                            <ReceptionistSignButton
                                                className="mx-5 cursor-default"
                                                key={visit.inviteID}
                                                onClick={(e) => {
                                                    e.stopPropagation();

                                                    setCurrentVisitData(visit);

                                                    setCurrentButton(
                                                        e.currentTarget
                                                            .classList
                                                    );
                                                    setSignedInInvites(
                                                        visit.inviteID
                                                    );
                                                    setShowVisitorModal(false);
                                                }}
                                                text="Signed In"
                                                colour={
                                                    visit.inviteState ===
                                                    "extended"
                                                        ? "bg-warning "
                                                        : "bg-success"
                                                }
                                                signInTime={
                                                    visit.inviteState ===
                                                    "extended"
                                                        ? visit.signInTime
                                                        : null
                                                }
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <h3 className="ml-3">Nothing to show..</h3>
                        )}
                    </div>
                </div>

                {searching ? (
                    <div className="card h-fit bg-base-300 p-3">
                        <div className="flex flex-col">
                            <h2 className="ml-3 mb-3 text-xl font-bold">
                                SIGNED-OUT INVITES
                            </h2>
                            {loading ? (
                                <progress className="progress progress-primary w-56">
                                    progress
                                </progress>
                            ) : signedOutInvites.length > 0 ? (
                                <div className="flex h-80 flex-col gap-2 overflow-y-scroll p-2">
                                    {signedOutInvites.map((visit, idx) => {
                                        return (
                                            <div
                                                className="m-1 flex flex flex-row items-center justify-between rounded-lg bg-base-100 p-3 shadow-xl hover:bg-base-200"
                                                key={visit.inviteID}
                                                onClick={() => {
                                                    setCurrentVisitData(visit);
                                                    setShowVisitorModal(true);
                                                }}
                                            >
                                                <div className="flex flex-row items-center justify-center">
                                                    <BsInfoCircle className="mr-5 ml-2" />

                                                    <div className="flex flex-col items-start">
                                                        <div className="text-md font-bold capitalize">
                                                            {visit.visitorName}
                                                        </div>
                                                        <div className="text-sm">
                                                            {visit.idNumber}
                                                        </div>
                                                    </div>
                                                </div>

                                                <ReceptionistSignButton
                                                    key={visit.inviteID}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                    }}
                                                    text="Signed Out"
                                                    colour="bg-tertiary"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <h3 className="ml-3">Nothing to show..</h3>
                            )}
                        </div>
                    </div>
                ) : (
                    <div></div>
                )}
            </div>

            <input
                type="checkbox"
                id="signIn-modal"
                className="modal-toggle"
                onChange={() => {}}
                checked={showSignInModal ? true : false}
            />
            <div className="fade modal cursor-pointer" id="signIn-modal">
                <div className="modal-box">
                    <label
                        htmlFor="signIn-modal"
                        className="btn btn-circle btn-sm absolute right-2 top-2"
                        onClick={() => {
                            setShowSignInModal(false);
                        }}
                    >
                        ✕
                    </label>
                    <SignInPopUp
                        showSignInModal={showSignInModal}
                        refetch={invitesQuery}
                        setShowSignInModal={setShowSignInModal}
                        setSearch={setSearch}
                    />
                </div>
            </div>

            <input
                type="checkbox"
                id="signOut-modal"
                className="modal-toggle"
            />

            <input
                type="checkbox"
                id="signOut-modal"
                className="modal-toggle"
                onChange={() => {}}
                checked={showSignOutModal ? true : false}
            />
            <div className="fade modal cursor-pointer" id="signOut-modal">
                <div className="modal-box">
                    <label
                        htmlFor="signOut-modal"
                        className="btn btn-circle btn-sm"
                        onClick={() => {
                            setShowSignOutModal(false);
                        }}
                    >
                        ✕
                    </label>
                    <SignOutPopUp
                        visitData={currentVisitData}
                        setShowInfoAlert={setShowInfoAlert}
                        setTrayNr={setTrayNr}
                        refetch={invitesQuery}
                        currentButton={currentButton}
                        setShowSignOutModal={setShowSignOutModal}
                        setSearch={setSearch}
                    />
                </div>
            </div>

            <input
                type="checkbox"
                id="QRScan-modal"
                className="modal-toggle"
                onChange={() => {}}
                checked={showScanner ? true : false}
            />
            <div className="fade modal" id="QRScan-modal">
                <div className="modal-box flex flex-wrap">
                    <label
                        htmlFor="QRScan-modal"
                        className="btn btn-circle btn-sm absolute right-2 top-2 z-10"
                        onClick={() => {
                            setShowScanner(false);
                        }}
                    >
                        ✕
                    </label>
                    <QRScanner
                        showScanner={showScanner}
                        setCurrentVisitData={setCurrentVisitData}
                        setShowScanner={setShowScanner}
                        setShowVisitorModal={setShowVisitorModal}
                        setShowSignInModal={setShowSignInModal}
                        setShowSignOutModal={setShowSignOutModal}
                        setVisitorData={setVisitorData}
                        setSearch={setSearch}
                        todayString={todayString}
                        setErrorMessage={setErrorMessage}
                        setShowErrorAlert={setErrorMessage}
                    />
                </div>
            </div>

            <input
                type="checkbox"
                id="VistorInfo-modal"
                className="modal-toggle"
                onChange={() => {}}
                checked={showVisitorModal ? true : false}
            />
            <div className="fade modal-lg modal " id="VistorInfo-modal">
                <div className="modal-box flex flex-wrap">
                    <label
                        htmlFor="VistorInfo-modal"
                        className="btn btn-circle btn-sm absolute right-2 top-2 z-10"
                        onClick={() => setShowVisitorModal(false)}
                    >
                        ✕
                    </label>
                    <VisitInfoModal
                        visitModalData={currentVisitData}
                        setCurrentVisitData={setCurrentVisitData}
                        setShowSignOutModal={setShowSignOutModal}
                        setShowVisitorModal={setShowVisitorModal}
                        parkingNumber={currentParkingNumber}
                    />
                </div>
            </div>

            <input
                type="checkbox"
                id="Upload-modal"
                className="modal-toggle"
                checked={showUploadPopUp ? true : false}
            />
            <div className="fade modal" id="Upload-modal">
                <div className="modal-box flex flex-wrap">
                    <label
                        htmlFor="Upload-modal"
                        className="btn btn-circle btn-sm absolute right-2 top-2 z-10"
                        onClick={() => setShowUploadPopUp(false)}
                    >
                        ✕
                    </label>
                    <UploadPopUp
                        setErrorMessage={setErrorMessage}
                        setShowErrorAlert={setShowErrorAlert}
                        setSuccessMessage={setSuccessMessage}
                        setShowSuccessAlert={setShowSuccessAlert}
                        setShowUploadPopUp={setShowUploadPopUp}
                        refetch={invitesQuery}
                    />
                </div>
            </div>
        </Layout>
    );
};

export async function getStaticProps(context) {
    return {
        props: {
            protected: true,
        },
    };
}

export default ReceptionistDashboard;
