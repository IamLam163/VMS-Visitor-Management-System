import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { gql, useQuery } from "@apollo/client";

import { AiOutlineDoubleLeft } from "react-icons/ai";
import { HiOutlineDocumentReport } from "react-icons/hi";
import { BiCheckShield } from "react-icons/bi";
import { BsShieldX } from "react-icons/bs";

import useDateRange from "../hooks/useDateRange.hook";

import Layout from "../components/Layout";
import DownloadChart from "../components/DownloadChart";
import LineChart from "../components/LineChart";

import useAuth from "../store/authStore";

const UserAnalytics = () => {
    const router = useRouter();
    const { name, email, permission } = router.query;
    const token = useAuth((state) => state.decodedToken)();

    const now = new Date();
    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];

    const [
        startDate,
        endDate,
        dateMap,
        setDateMap,
        setStartDate,
        setRange,
        range,
    ] = useDateRange(new Date(now.getFullYear(), now.getMonth(), 1), 30);

    const deleteUserAccount = (email, type) => {
        client
            .mutate({
                mutation: gql`
                mutation {
                    deleteUserAccount(email: "${email}") 
                }
            `,
            })
            .then((res) => {
                if (res.data.deleteUserAccount === true) {
                    if (type === "Receptionist") {
                        setReceptionistData(
                            receptionistData.filter(
                                (data) => data.email !== email
                            )
                        );
                    } else {
                        setResidentData(
                            residentData.filter((data) => data.email !== email)
                        );
                    }
                } else {
                    console.log("ERROR!");
                }
            })
            .catch((err) => {
                console.error(err);
            });
    };

    const authorizeUserAccount = (email, type) => {
        client
            .mutate({
                mutation: gql`
                mutation {
                    authorizeUserAccount(email: "${email}")
                }
            `,
            })
            .then((res) => {
                if (res.data.authorizeUserAccount === true) {
                    if (type === "Receptionist") {
                        setReceptionistData(
                            receptionistData.filter(
                                (data) => data.email !== email
                            )
                        );
                    } else {
                        setResidentData(
                            residentData.filter((data) => data.email !== email)
                        );
                    }
                }
            })
            .catch((err) => {
                console.error(err);
            });
    };

    // Visitor invite data object for chart
    const [visitorVals, setVisitorVals] = useState({ data: [], labels: [] });

    const [numInvites, setNumInvites] = useState(0);

    const [auth, setAuth] = useState(permission >= 0 ? true : false);

    const [showConfirm, setShowConfirm] = useState(false);

    const { loading, error, data } = useQuery(gql`
        query {
            getNumInvitesPerDateOfUser(dateStart: "${startDate}", dateEnd: "${endDate}", email: "${email}") {
                visitorEmail,
                visitorName,
                inviteDate
            }
        }
    `);

    const getTotalNumberOfInvites = useQuery(gql`
        query {
            getTotalNumberOfInvitesOfResident(email: "${email}")
        }
    `);

    useEffect(() => {
        if (!loading && !error) {
            const invites = data.getNumInvitesPerDateOfUser;
            invites.forEach((invite) => {
                dateMap.set(
                    invite.inviteDate,
                    dateMap.get(invite.inviteDate) + 1
                );
            });

            setDateMap(new Map(dateMap));

            setVisitorVals({
                data: Array.from(dateMap.values()),
                labels: Array.from(dateMap.keys()),
            });
        } else if (error) {
            if (error.message === "Unauthorized") {
                router.push("/expire");
            }
            console.error(error);
        }
    }, [loading, error, router, setDateMap, range]);

    useEffect(() => {
        if (
            !getTotalNumberOfInvites.loading &&
            !getTotalNumberOfInvites.error
        ) {
            setNumInvites(
                getTotalNumberOfInvites.data.getTotalNumberOfInvitesOfResident
            );
        }
    }, [getTotalNumberOfInvites]);

    
    return (
        <Layout>
            <div className="mb-3 mt-4 space-y-5 px-3">
                <div className="flex-col">
                    <h1 className="text-xl font-bold md:text-2xl lg:text-3xl">
                        User Report For{" "}
                        <span className="capitalize text-secondary">
                            {name}
                        </span>
                    </h1>
                    <Link href="/adminDashboard">
                        <a className="link flex items-center font-bold normal-case">
                            <span>
                                <AiOutlineDoubleLeft />
                            </span>
                            Go Back
                        </a>
                    </Link>
                </div>

                <div className="flex">
                    <div className="card bg-base-200 shadow-xl w-full">
                        <div className="card-body flex-col">
                            <h2 className="card-title">
                                <div className="avatar placeholder">
                                    <div className="bg-neutral-focus text-neutral-content rounded-full w-16">
                                        <span className="text-3xl font-normal">{name[0]}</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-primary">{name}</p>
                                    <p className="text-sm font-normal text-base">{numInvites} invites in lifetime</p>
                                </div>
                            </h2>
                            <div className="divider">Reports</div>
                            <DownloadChart
                                title={
                                "User Invites"
                            }
                            filename={name+"-forecast.png"}
                            Chart={LineChart}
                            labelvals={visitorVals.labels}
                            datavals={visitorVals.data}
                            setStart={setStartDate}
                            setRange={setRange}
                        />

                        {loading && <p>Loading</p>}
                            <div className="card-actions justify-start items-center">
                                <Link
                                    href={`/viewReport?email=${email}&startDate=${startDate}&endDate=${endDate}&name=${name}&total=${numInvites}`}
                                >
                                    <a className="btn btn-primary"><HiOutlineDocumentReport className="text-xl"/>PDF Report</a>
                                </Link>
                                { token.email !== email && 
                                    <label
                                        className="label cursor-pointer space-x-3"
                                        onChange={() => {
                                            setAuth(!auth);
                                            setShowConfirm(!showConfirm);
                                        }}
                                        onClick={() => setAuth(!auth)}
                                    >
                                    <span className="label-text">Authorize</span>
                                    <input
                                        type="checkbox"
                                        className="toggle toggle-primary"
                                        checked={auth ? true : false}
                                    />
                                    </label>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export async function getStaticProps(context) {
    return {
        props: {
            protected: true,
            permission: 0,
        },
    };
}

export default UserAnalytics;
