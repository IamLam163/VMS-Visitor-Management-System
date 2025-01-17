import Link from "next/link";
import { useState, useEffect } from "react";
import { gql, useQuery, useApolloClient } from "@apollo/client";
import { useRouter } from "next/router";

import { BiMailSend, BiStats } from "react-icons/bi";
import { AiFillAlert, AiFillClockCircle } from "react-icons/ai";
import { FaBed } from "react-icons/fa";

import Layout from "../components/Layout";
import DownloadChart from "../components/DownloadChart";
import LineChart from "../components/LineChart";
import PieChart from "../components/PieChart";
import VisitorCard from "../components/VisitorCard";
import OpenInviteCard from "../components/OpenInviteCard";

import useDateRange from "../hooks/useDateRange.hook";

import useAuth from "../store/authStore";

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

const VisitorDashboard = () => {
    const token = useAuth((state) => state.decodedToken)();
    const [showErrorAlert, setShowErrorAlert] = useState(false);
    const [inviteModal, setInviteModal] = useState({
        show: false,
        data: undefined,
    });
    const [errorMessage, setErrorMessage] = useState("");
    const [maxNumInvites, setMaxNumInvites] = useState(0);
    const [curfew, setCurfew] = useState("0000");
    const [maxSleepovers, setMaxSleepovers] = useState(0);
    const [todayInvites, setTodayInvites] = useState(0);
    const [openInvites, setOpenInvites] = useState([]);
    const [percentage, setPercentage] = useState(0);
    const [visitorData, setVisitorData] = useState({ data: [], labels: [] });
    const [historyInvites, setHistoryInvites] = useState([]);
    const [invites, setInvites] = useState([]);
    const [visitors, setVisitors] = useState([]);
    const [selectedVisitor, setSelectedVisitor] = useState(false);
    const now = getFormattedDateString(new Date());
    const [numUsed, setNumUsed] = useState(0);
    const [numCancelled, setNumCancelled] = useState(0);
    const [numUnused, setNumUnused] = useState(0);
    const [totalNumberInvites, setTotalNumberInvites] = useState(0);

    const sum = (data) => {
        let sum = 0;
        data.forEach((val) => {
            sum += val;
        });
        return sum;
    };

    const [
        startDate,
        endDate,
        dateMap,
        setDateMap,
        setStartDate,
        setRange,
        range,
    ] = useDateRange(now, 7);

    const router = useRouter();
    const { loading, error, data } = useQuery(
        gql`
            query {
                getInvites {
                    idNumber
                    visitorEmail
                    visitorName
                    idDocType
                    inviteID
                    inviteDate
                    inviteState
                }
            }
        `
    );

    if (data && data.getInvites) {
        console.log(data.getInvites);
    }

    const numInvitesQuery = useQuery(
        gql`
            query {
                getNumInvites(email: "${token.email}")
            }
        `,
        { fetchPolicy: "network-only" }
    );

    const numSleepoversQuery = useQuery(
        gql`
            query {
                getNumSleepovers(email: "${token.email}")
            }
        `,
        { fetchPolicy: "network-only" }
    );

    const curfewTimeQuery = useQuery(
        gql`
            query {
                getCurfewTimeOfResident(email: "${token.email}")
            }
        `,
        { fetchPolicy: "network-only" }
    );

    const visitorsQuery = useQuery(
        gql`
            query {
              getVisitors(email: "${token.email}") {
                _id,
                visitorName,
                numInvites
              }
            }
        `
    );

    const client = useApolloClient();
    const cancelInvite = (inviteID) => {
        client
            .mutate({
                mutation: gql`
                mutation {
                    cancelInvite(inviteID: "${inviteID}")
                }
            `,
            })
            .then((res) => {
                const otherInviteData = invites.filter((invite) => {
                    return invite.inviteID !== inviteID;
                });

                const newOpen = openInvites.filter((invite) => {
                    return (
                        invite.inviteID !== inviteID && invite.inviteDate >= now
                    );
                });

                setOpenInvites(newOpen);
                setInvites(otherInviteData);

                setNumCancelled(numCancelled + 1);

                otherInviteData.forEach((invite) => {
                    invite.inviteDate >= now &&
                        dateMap.set(
                            invite.inviteDate,
                            dateMap.get(invite.inviteDate) + 1
                        );
                });
                setDateMap(new Map(dateMap));

                setVisitorData({
                    data: Array.from(dateMap.values()),
                    labels: Array.from(dateMap.keys()),
                });
            })
            .catch((err) => {
                console.log(err);
                setShowErrorAlert(true);
                setErrorMessage(err);
            });
    };

    useEffect(() => {
        if (!loading && !error) {
            const invites = data.getInvites;
            setTotalNumberInvites(invites.length);
            setInvites(invites);

            const tempInvites = [];
            const tempHistoryInvites = [];
            let _numCancelled = 0;
            let _numUsed = 0;
            let _numUnused = 0;

            invites.forEach((invite) => {
                if (invite.inviteDate >= now) {
                    dateMap.set(
                        invite.inviteDate,
                        dateMap.get(invite.inviteDate) + 1
                    );
                }

                if (
                    invite.inviteDate < now ||
                    invite.inviteState === "signedOut" ||
                    invite.inviteState === "signedIn"
                ) {
                    tempHistoryInvites.push(invite);
                }

                if (invite.inviteState === "cancelled") {
                    _numCancelled++;
                }

                if (invite.inviteState === "inActive") {
                    _numUnused++;
                }

                if (
                    invite.inviteState === "signedIn" ||
                    invite.inviteState === "signedOut" ||
                    invite.inviteState === "extended"
                ) {
                    _numUsed++;
                }

                if (
                    invite.inviteState === "inActive" &&
                    invite.inviteDate >= now
                ) {
                    tempInvites.push(invite);
                }
            });

            setNumCancelled(_numCancelled);
            setNumUnused(_numUnused);
            setNumUsed(_numUsed);

            tempHistoryInvites.sort((lhs, rhs) => {
                return new Date(rhs.inviteDate) - new Date(lhs.inviteDate);
            });

            if (tempInvites.length > 4) {
                const topInvites = [];
                for (let i = 0; i < 4; i++) {
                    topInvites.push(tempInvites[i]);
                }
                setOpenInvites(tempInvites);
            } else {
                setOpenInvites(tempInvites);
            }

            setDateMap(new Map(dateMap));
            setHistoryInvites(tempHistoryInvites);

            setVisitorData({
                data: Array.from(dateMap.values()),
                labels: Array.from(dateMap.keys()),
            });
        } else if (error) {
            if (error.message === "Unauthorized") {
                router.push("/expire");
                return;
            }
        }
    }, [loading, error, data, setStartDate, now, range]);

    useEffect(() => {
        if (!numInvitesQuery.loading && !numInvitesQuery.error) {
            const maxNum = numInvitesQuery.data.getNumInvites;
            setMaxNumInvites(maxNum);
            if (maxNumInvites > 0) {
                const percentage = (openInvites.length / maxNumInvites) * 100;
                setPercentage(Math.floor(percentage));
            } else {
                setPercentage(0);
            }
        }
    }, [numInvitesQuery, openInvites.length, maxNumInvites]);

    useEffect(() => {
        if (!numSleepoversQuery.loading && !numSleepoversQuery.error) {
            setMaxSleepovers(numSleepoversQuery.data.getNumSleepovers);
        }
    }, [numSleepoversQuery, maxSleepovers]);

    useEffect(() => {
        if (!curfewTimeQuery.loading && !curfewTimeQuery.error) {
            let time = curfewTimeQuery.data.getCurfewTimeOfResident.toString();
            while (time.length < 3) {
                time = "0" + time;
            }
            setCurfew(time);
        }
    }, [curfewTimeQuery, curfew]);

    useEffect(() => {
        if (!visitorsQuery.loading && !visitorsQuery.error) {
            const visitorData = visitorsQuery.data.getVisitors;
            if (visitorData.length > 4) {
                const temp = [];
                for (let i = 0; i < 4; i++) {
                    temp.push(visitorData[i]);
                }
                setVisitors(temp);
            } else {
                setVisitors(visitorsQuery.data.getVisitors);
            }
        }
    }, [visitorsQuery]);

    useEffect(() => {
        const todayInviteData = invites.filter((invite) => {
            return invite.inviteDate === now;
        });
        setTodayInvites(todayInviteData.length);
    }, [invites, now]);

    return (
        <Layout>
            <div className="p-3">
                <h1 className="mt-5 mb-5 flex items-center text-left text-xl font-bold md:text-2xl lg:text-4xl">
                    <span>Welcome back,</span>
                    <span className="ml-3 text-secondary">{token.name}</span>
                </h1>
                <p>You have {todayInvites} visitors expected today.</p>
            </div>
            <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="card ml-2 w-full bg-base-200 p-3">
                    <h2 className="card-title text-2xl">
                        <BiStats className="text-3xl text-primary" />
                        Invite Data
                    </h2>
                    <div className="p-10 md:p-14">
                        <PieChart
                            chartRef={null}
                            datalabels={["Invites"]}
                            labelvals={["Cancelled", "Used Invites"]}
                            datavals={[numCancelled, numUsed]}
                        />
                    </div>
                </div>
                <div className="col-span-2 grid grid-cols-1 gap-5 md:col-span-1">
                    <div className="card h-full w-full bg-base-200 p-5 shadow">
                        <h2 className="card-title">
                            <span className="text-2xl text-primary">
                                <BiMailSend />
                            </span>
                            Total Number Of Invites Sent
                        </h2>
                        <div className="card-body justify-center">
                            <div className="flex items-center">
                                <div className="flex flex-col">
                                    <h1 className="text-4xl font-bold">
                                        {totalNumberInvites}
                                    </h1>
                                    <p>Invites Sent In Lifetime</p>
                                </div>
                            </div>
                        </div>
                        <div className="card-actions"></div>
                    </div>
                    <div className="card h-full w-full bg-base-200 p-5 shadow">
                        <h2 className="card-title">
                            <span className="text-2xl text-primary">
                                <AiFillAlert />
                            </span>
                            Maximum Invites Allowed
                        </h2>
                        <div className="card-body justify-center">
                            <div className="flex items-center space-x-8">
                                <div className="flex items-center justify-center">
                                    <div
                                        className="radial-progress text-base-content"
                                        style={{
                                            "--value": Number(percentage),
                                        }}
                                    >
                                        {percentage}%
                                    </div>
                                </div>
                                <div className="flex-col text-sm md:text-base">
                                    <p>
                                        You currently have {openInvites.length}{" "}
                                        open invites.
                                    </p>
                                    <p>
                                        You are allowed to send {maxNumInvites}{" "}
                                        in total
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="card h-full bg-base-200 p-4 pb-1 shadow">
                            <h2 className="card-title font-bold">
                                <span className="text-2xl text-primary">
                                    <AiFillClockCircle />
                                </span>
                                Visitor Curfew
                            </h2>
                            <div className="card-body justify-center">
                                <h1 className="text-5xl font-bold">
                                    {curfew.slice(0, -2) +
                                        " : " +
                                        curfew.slice(-2)}
                                </h1>
                            </div>
                            <div className="card-actions"></div>
                        </div>
                    </div>
                </div>
                <div className="col-span-2 grid grid-cols-1 grid-rows-2 gap-4 md:grid-cols-2 md:grid-rows-1">
                    <div className="col-span-2 row-span-1">
                        <div className="card bg-base-200 p-5">
                            <div className="flex flex-col">
                                <h2 className="ml-3 text-xl font-bold">
                                    Popular Visitors
                                </h2>
                                {visitorsQuery.loading ? (
                                    <progress className="progress progress-primary w-full "></progress>
                                ) : visitors.length === 0 ? (
                                    <p className="ml-3">Nothing to show...</p>
                                ) : (
                                    <div className="flex flex-col justify-center gap-3 p-1 font-bold md:p-2 lg:p-3">
                                        {" "}
                                        {visitors.map((visitor, idx) => {
                                            return (
                                                <VisitorCard
                                                    key={idx}
                                                    name={visitor.visitorName}
                                                    email={visitor._id}
                                                    numInvites={
                                                        visitor.numInvites
                                                    }
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="col-span-2 row-span-2">
                        <div className="card h-full bg-base-300 p-5">
                            <div className="flex flex-col">
                                <h2 className="ml-3 text-xl font-bold">
                                    Open Invites
                                </h2>
                                {loading ? (
                                    <progress className="progress progress-primary mt-3 w-full"></progress>
                                ) : openInvites.length === 0 ? (
                                    <p className="ml-3 text-center">
                                        Uh oh... Maybe try sending an invite
                                    </p>
                                ) : (
                                    <div className="flex flex-col justify-center gap-3 overflow-y-scroll p-3">
                                        {openInvites.map((visit, idx) => {
                                            return (
                                                <OpenInviteCard
                                                    key={visit.inviteID}
                                                    name={visit.visitorName}
                                                    email={visit.visitorEmail}
                                                    inviteID={visit.inviteID}
                                                    inviteDate={
                                                        visit.inviteDate
                                                    }
                                                    idDocType={visit.idDocType}
                                                    idNumber={visit.idNumber}
                                                    cancelInvite={cancelInvite}
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-span-1 space-y-4 overflow-x-auto md:col-span-2">
                    <div className="grid grid-cols-1 gap-4">
                        <h2 className="divider col-span-2 ml-2 mt-5 text-3xl font-bold">
                            Invite History
                        </h2>
                        <div className="grid min-h-0 grid-cols-1 overflow-x-auto">
                            <table className="table-compact row-span-1 table w-full md:table-normal">
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>Name</th>
                                        <th>ID Document Type</th>
                                        <th>Date</th>
                                        <th>Invite State</th>
                                    </tr>
                                </thead>
                                {historyInvites.length > 0 ? (
                                    <tbody>
                                        {historyInvites.map((visit, idx) => {
                                            return (
                                                <tr
                                                    data-testid="historyInvite"
                                                    onClick={() => {
                                                        setInviteModal({
                                                            show: true,
                                                            data: {
                                                                name: visit.visitorName,
                                                                id: visit.idNumber,
                                                                doc: visit.idDocType,
                                                                email: visit.visitorEmail,
                                                            },
                                                        });
                                                    }}
                                                    className="hover cursor-pointer"
                                                    key={idx}
                                                >
                                                    <th>{idx + 1}</th>
                                                    <td className="capitalize">
                                                        {visit.visitorName}
                                                    </td>
                                                    <td>{visit.idDocType}</td>
                                                    <td>{visit.inviteDate}</td>
                                                    <td>
                                                        {visit.inviteState ===
                                                        "inActive" ? (
                                                            <div className="badge">
                                                                In Active
                                                            </div>
                                                        ) : visit.inviteState ===
                                                          "signedIn" ? (
                                                            <div className="badge badge-success">
                                                                Signed In
                                                            </div>
                                                        ) : (
                                                            <div className="badge badge-error">
                                                                Signed Out
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                ) : (
                                    <tbody>
                                        <tr>
                                            <th>Nothing to show...</th>
                                        </tr>
                                    </tbody>
                                )}
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            <input
                type="checkbox"
                id="invite-modal"
                className="modal-toggle"
                checked={inviteModal.show ? true : false}
            />
            <div className="modal">
                {inviteModal.data && (
                    <div className="modal-box relative">
                        <label
                            data-testid="closeInviteModal"
                            onClick={() =>
                                setInviteModal({ ...inviteModal, show: false })
                            }
                            htmlFor="invite-modal"
                            className="btn btn-circle btn-sm absolute right-2 top-2"
                        >
                            ✕
                        </label>
                        <h3 className="text-lg font-bold">
                            Would you like to invite{" "}
                            <span className="capitalize text-secondary">
                                {inviteModal && inviteModal.data.name}
                            </span>{" "}
                            again?
                        </h3>
                        <p className="py-4">
                            You will be redirected to the create invite page to
                            specify details for the invitation.
                        </p>
                        <div className="modal-action">
                            <Link
                                href={
                                    "/createInvite?name=" +
                                    inviteModal.data.name +
                                    "&idNumber=" +
                                    inviteModal.data.id +
                                    "&idDocType=" +
                                    inviteModal.data.doc +
                                    "&email=" +
                                    inviteModal.data.email
                                }
                            >
                                <a className="btn btn-primary">Yes</a>
                            </Link>
                        </div>
                    </div>
                )}
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

export default VisitorDashboard;
