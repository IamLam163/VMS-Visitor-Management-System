import { useRouter } from "next/router";
import { useState, useEffect, useRef } from "react";
import { gql, useQuery, useMutation } from "@apollo/client";

import Layout from "../components/Layout";
import AdminCard from "../components/AdminCard";
import LineChart from "../components/LineChart";
import DownloadChart from "../components/DownloadChart";
import VisitorSearchResults from "../components/VisitorSearchResults";

import useDateRange from "../hooks/useDateRange.hook";
import useAuth from "../store/authStore";

import { AiOutlinePlus, AiOutlineMinus, AiOutlineCar } from "react-icons/ai";
import { BiBuildingHouse, BiMailSend } from "react-icons/bi";
import { FaSearch } from "react-icons/fa";
import { MdBlock, MdDataSaverOn, MdDataSaverOff } from "react-icons/md";

// Returns string in format yyyy-mm-dd given Date Object
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

const AdminDashboard = () => {
    // NextJS Page Router
    const router = useRouter();

    // Number of invites sent state
    const [numInvitesSent, setNumInvitesSent] = useState(0);

    // Visitor invite data object for chart
    const [visitorVals, setVisitorVals] = useState({ data: [], labels: [] });

    // Parking data object for chart
    const [parkingVals, setParkingVals] = useState({ data: [], labels: [] });

    // Date Range Hook
    const [startDate, endDate, dateMap, setDateMap, setStartDate] =
        useDateRange(getFormattedDateString(new Date(Date.now())), 7);

    // Start Date State
    const [start, setStart] = useState(startDate);

    // Initial number of invites per resident for fallback
    const [initialNumInvitesPerResident, setInitialNumInvitesPerResident] =
        useState(1);

    // State to track whether the restrictions have changed
    const [restrictionsChanged, setRestrictionsChanged] = useState(false);

    // State for invites for today
    const [todayInvites, setTodayInvites] = useState(0);

    // Search visitor name state
    const [name, setName] = useState("");

    const [numParkingSpotsAvailable, setNumParkingSpotsAvailable] = useState(0);
    const updateParkingSpots = useAuth((state) => {
        return state.updateParkingSpots;
    });

    // JWT Token data from Model
    const decodedToken = useAuth((state) => {
        return state.decodedToken;
    })();

    const numInvitesPerResidentQuery = useQuery(gql`
        query {
            getNumInvitesPerResident {
                value
            }
        }
    `);

    // Number of invites per resident state
    const [numInvitesPerResident, setNumInvitesPerResident] = useState(1);

    const numInvitesQuery = useQuery(gql`
        query {
            getTotalNumberOfVisitors
        }
    `);

    const numInviteInDateRangeQuery = useQuery(
        gql`
        query {
            getNumInvitesPerDate(
                dateStart: "${start}",
                dateEnd: "${endDate}"
            ) {
                inviteDate
            }
        }
    `,
        { fetchPolicy: "no-cache" }
    );

    const numParkingInDateRangeQuery = useQuery(gql`
        query {
            getUsedParkingsInRange(startDate: "${startDate}", endDate: "${endDate}") {
                reservationDate
            }
        }
    `);

    const numParkingSpotsAvailableQuery = useQuery(gql`
        query {
            getTotalAvailableParking
        }
    `);

    const [setNumInvitesPerResidentMutation, { data, loading, error }] =
        useMutation(gql`
        mutation {
          setNumInvitesPerResident(numInvites: ${numInvitesPerResident}) {
            value
          }
        }
    `);

    const cancelRestrictions = () => {
        setNumInvitesPerResident(initialNumInvitesPerResident);
        setRestrictionsChanged(false);
    };

    const saveRestrictions = () => {
        setInitialNumInvitesPerResident(numInvitesPerResident);
        setNumInvitesPerResidentMutation();
        setRestrictionsChanged(false);
    };

    useEffect(() => {
        // Num invites
        if (!numInvitesQuery.loading && !numInvitesQuery.error) {
            const invites = numInvitesQuery.data.getTotalNumberOfVisitors;
            setNumInvitesSent(invites);
        } else if (numInvitesQuery.error) {
            if (numInvitesQuery.error.message === "Unauthorized") {
                router.push("/expire");
                return;
            }
        }

        // Num invites in range
        if (
            !numInviteInDateRangeQuery.loading &&
            !numInviteInDateRangeQuery.error
        ) {
            const invites = numInviteInDateRangeQuery.data.getNumInvitesPerDate;
            invites.forEach((invite) => {
                if (!isNaN(dateMap.get(invite.inviteDate))) {
                    dateMap.set(
                        invite.inviteDate,
                        dateMap.get(invite.inviteDate) + 1
                    );
                }
            });

            setDateMap(new Map(dateMap));
            setVisitorVals({
                data: Array.from(dateMap.values()),
                labels: Array.from(dateMap.keys()),
            });

            setTodayInvites(dateMap.get(startDate));
        } else if (numInviteInDateRangeQuery.error) {
            console.error(numInviteInDateRangeQuery.error);
        }

        // Num parking in range
        if(!numParkingInDateRangeQuery.loading && !numParkingInDateRangeQuery.error) {
            const parkingNumbers = numParkingInDateRangeQuery.data.getUsedParkingsInRange;
            console.log(parkingNumbers);

            setParkingVals({
                labels: Array.from(dateMap.keys()),
                data: Array.from(parkingNumbers),
            });

        } else if(numParkingInDateRangeQuery.error) {
            console.error(numParkingInDateRangeQuery.error);
        }

        // Parking spots available
        if (
            !numParkingSpotsAvailableQuery.loading &&
            !numParkingSpotsAvailableQuery.error
        ) {
            const numParkingspots = numParkingSpotsAvailableQuery.data.getTotalAvailableParking;
            setNumParkingSpotsAvailable(numParkingspots);
        } else if (numParkingSpotsAvailableQuery.error) {
            setNumParkingSpotsAvailable("Error");
        }

        if (
            !numInvitesPerResidentQuery.loading &&
            !numInvitesPerResidentQuery.error
        ) {
            setNumInvitesPerResident(
                numInvitesPerResidentQuery.data.getNumInvitesPerResident.value
            );
            setInitialNumInvitesPerResident(numInvitesPerResident);
        } else if (numInvitesPerResident.error) {
        }
    }, [
        numInvitesQuery,
        numInviteInDateRangeQuery,
        numParkingSpotsAvailableQuery,
        numParkingInDateRangeQuery,
        startDate,
        setParkingVals,
        setNumParkingSpotsAvailable,
        numInvitesPerResidentQuery,
    ]);

    return (
        <Layout>
            <div className="mb-3 space-y-3 px-3">
                <div className="flex flex-col items-center justify-between md:flex-row">
                    <div className="flex-col">
                        <h1 className="mt-4 mb-4 text-3xl font-bold">
                            Hello{" "}
                            <span className="text-secondary">
                                {decodedToken.email}
                            </span>
                        </h1>
                        <p className="text-tertiary prose mb-4">
                            Welcome Back!
                        </p>
                    </div>

                    <div>
                        <div className="input-group">
                            <input
                                onChange={(e) => {
                                    setName(e.target.value);
                                }}
                                type="text"
                                placeholder="Search…"
                                className="input input-bordered"
                            />
                            <label
                                htmlFor="visitor-modal"
                                className="btn btn-square"
                            >
                                <FaSearch />
                            </label>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 grid-rows-1 space-y-3">
                    <div className="stats stats-vertical w-full shadow lg:stats-horizontal">
                        <AdminCard
                            description="Total Number Of Invites For Today"
                            Icon={BiBuildingHouse}
                            dataval={todayInvites}
                            unit="Total"
                        />
                        <AdminCard
                            description="Total Number Of Invites Sent"
                            Icon={BiMailSend}
                            dataval={numInvitesSent}
                            unit="Total"
                        />
                        <AdminCard
                            description="Total Number Of Parking Spots Available"
                            Icon={AiOutlineCar}
                            dataval={numParkingSpotsAvailable}
                            unit="Total"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-3 text-secondary-content md:grid-cols-2">
                        <DownloadChart
                            title={"Visitor Forecase For The Week"}
                            filename="visitor-forecast.png"
                            Chart={LineChart}
                            labelvals={visitorVals.labels}
                            datavals={visitorVals.data}
                            setStart={setStartDate}
                        />
                        <DownloadChart
                            title={"Parking Forecast For The Week"}
                            filename="visitor-forecast.png"
                            Chart={LineChart}
                            labelvals={parkingVals.labels}
                            datavals={parkingVals.data}
                            setStart={setStartDate}
                        />
                    </div>

                    <h1 className="flex flex-col items-center space-x-3 text-2xl font-bold lg:flex-row">
                        <span className="mr-3 text-xl text-primary md:text-3xl">
                            <MdBlock />
                        </span>{" "}
                        System Restrictions
                        <span>
                            {restrictionsChanged && (
                                <div className="space-x-5">
                                    <button
                                        onClick={saveRestrictions}
                                        className="btn btn-primary btn-sm space-x-3 lg:btn-md"
                                    >
                                        <span>
                                            <MdDataSaverOn className="mr-3 text-xl" />
                                        </span>{" "}
                                        Save Changes
                                    </button>
                                    <button
                                        onClick={cancelRestrictions}
                                        className="btn btn-secondary btn-sm space-x-3 lg:btn-md"
                                    >
                                        <span>
                                            <MdDataSaverOff className="mr-3 text-xl" />
                                        </span>{" "}
                                        Cancel Changes
                                    </button>
                                </div>
                            )}
                        </span>
                    </h1>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="card bg-base-300">
                            <div className="card-body">
                                <h2 className="card-title">
                                    Invites Per Resident{" "}
                                    <div className="badge badge-secondary">
                                        Resident
                                    </div>
                                </h2>
                                <p>
                                    Number of invites a resident is allowed to
                                    have open/sent at a time.
                                </p>
                                <div className="card-actions flex items-center justify-start">
                                    <div className="flex items-center space-x-3">
                                        <button
                                            data-testid="increaseInvites"
                                            className="btn btn-circle"
                                            onClick={() => {
                                                setNumInvitesPerResident(
                                                    numInvitesPerResident + 1
                                                );
                                                setRestrictionsChanged(true);
                                            }}
                                        >
                                            <AiOutlinePlus className="text-xl md:text-2xl lg:text-3xl" />
                                        </button>
                                        <p className="text-4xl font-bold text-secondary">
                                            {numInvitesPerResident}
                                        </p>
                                        <button
                                            data-testid="decreaseInvites"
                                            className="btn btn-circle"
                                            onClick={() => {
                                                numInvitesPerResident > 1 &&
                                                    setNumInvitesPerResident(
                                                        numInvitesPerResident -
                                                            1
                                                    );
                                                setRestrictionsChanged(true);
                                            }}
                                        >
                                            <AiOutlineMinus className="text-xl md:text-2xl lg:text-3xl" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card bg-base-300">
                            <div className="card-body">
                                <h2 className="card-title">
                                    Parking Spots Available{" "}
                                    <div className="badge badge-secondary">
                                        User
                                    </div>
                                </h2>
                                <p>
                                    Number of parking spots left in the
                                    building.
                                </p>
                                <div className="card-actions flex items-center justify-start">
                                    <div className="flex items-center space-x-3">
                                        <button className="btn btn-circle">
                                            <AiOutlinePlus className="text-xl md:text-2xl lg:text-3xl" />
                                        </button>
                                        <p className="text-4xl font-bold text-secondary">
                                            {numParkingSpotsAvailable}
                                        </p>
                                        <button className="btn btn-circle">
                                            <AiOutlineMinus className="text-xl md:text-2xl lg:text-3xl" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="modal" id="parking-modal">
                <div className="modal-box space-y-2">
                    <h3 className="text-md font-bold md:text-lg">
                        Update Number of Parking Spots Available
                    </h3>
                    <input
                        onChange={(e) => {
                            return updateParkingSpots(Number(e.target.value));
                        }}
                        className="input input-bordered w-full max-w-xs"
                        type="number"
                        placeholder={numParkingSpotsAvailable}
                    />
                    <div className="modal-action">
                        <a href="#" className="btn">
                            Update
                        </a>
                    </div>
                </div>
            </div>

            <input
                type="checkbox"
                id="visitor-modal"
                className="modal-toggle"
                onChange={(e) => {
                    setName(e.target.value);
                }}
                value={name}
            />
            <label htmlFor="visitor-modal" className="modal cursor-pointer">
                <label className="modal-box relative" htmlFor="">
                    <VisitorSearchResults query={name} />
                </label>
            </label>
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

export default AdminDashboard;
