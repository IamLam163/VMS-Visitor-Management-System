import { useState, useEffect , setState} from "react";
import { gql, useQuery, useApolloClient } from "@apollo/client";

import Layout from "../components/Layout";
import ErrorAlert from "../components/ErrorAlert";

import { useRouter } from "next/router";
import QRScanner from "../components/QRScanner";

const ReceptionistDashboard = () => {

    /*constructor() {
        super();
        this.state = {
          scanPopup: false,
          inviteID: ""
        };
    }*/
    
    const [visitorData, setIsVisitorData] = useState([]);
    const [showErrorAlert, scanPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const router = useRouter();
    const { loading, error, data } = useQuery(gql`
        query {
            getInvites {
                idNumber
                visitorEmail
                idDocType
                inviteID
            }
        }
    `);

   /* const { searching, err, invite } = useQuery(gql`
        query {
            getInvite( "${this.state.inviteID}" ) {
                inviteID
            }
        }
    `);*/

    const signIn = (inviteID) => {
        //TODO (Larisa)
    };

    const search = (inviteID) => {
        //TODO (Tabitha)
    };

    const scan = (inviteID) => {
       // this.state={scanPopup: !this.state.scanPopup}
    };

/*
    useEffect(() => {
        if (!loading && !error) {
            const invites = data.getInvites;
            setIsVisitorData(invites);
        } else if (error) {
            if (error.message === "Unauthorized") {
                router.push("/expire");
                return;
            }

            setIsVisitorData([
                {
                    visitorEmail: "ERROR",
                    idDocType: "ERROR",
                    isNumber: "ERROR",
                },
            ]);
        }
    }, [loading, error, router, data]);*/

    //////////////////////////////////////////////////////////////////////////////////////////////////
    return (
        <Layout>
            <input type="text" value = {this.state.search} placeholder="Search.." className="ml-5 input input-bordered input-primary w-4/6" />
            <button onClick={search} className="ml-5 mt-5 mb-5 btn btn-primary">Search</button>
            <button onClick={scan} className="mr-5 mt-5 mb-5 float-right btn btn-primary">Scan to Search</button>
            <h1 className="mt-5 mb-5 p-3 text-left text-4xl font-bold base-100">
                Todays Invites
            </h1>
            
            {/* <div className="mx-5 grid grid-cols-3 gap-4 content-evenly h-10 bg-base-300 rounded-md content-center">
                <div className="ml-2">Invitation Id</div>
                <div className="">Visitor Id</div>
                <div className=""></div>
            </div> */}
            <div className="flex h-full items-center justify-center overflow-x-auto p-3">    
                {loading ? (
                    <progress className="progress progress-primary w-56">
                        progress
                    </progress>
                ) : (
                    //TODO (Larisa) dont use table
                    <table className="mb-5 table w-full">
                        <thead>
                            <tr>
                                <th></th>
                                <th>Invitation ID</th>
                                <th>Visitor ID</th>
                                <th></th>
                            </tr>
                </thead>
                        {visitorData.length > 0 ? (
                            <tbody>
                                {visitorData.map((visit, idx) => {
                                    return (
                                        <tr className="hover" key={idx}>
                                            <th>{idx + 1}</th>
                                            <td>{visit.inviteID}</td>
                                            <td>0012120178087</td>
                                            <td>
                                                <button
                                                    className="btn text-white border-0 bg-green-800 max-w-md"
                                                    onClick={() =>
                                                        signIn(
                                                            visit.inviteID
                                                        )
                                                    }
                                                >Sign In   
                                                </button>
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
                )}
            </div>
            <ErrorAlert message={errorMessage} showConditon={showErrorAlert} />
            <QRScanner showCondition={scanPopup} />
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
