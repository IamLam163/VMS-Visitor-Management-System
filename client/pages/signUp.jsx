import { useEffect, useState } from "react";
import Link from "next/link";

import { useRouter } from "next/router";
import { useApolloClient } from "@apollo/client";

import Layout from "../components/Layout";
import useAuth from "../store/authStore";

const SignUp = () => {
    const permission = useAuth((state) => {
        return state.permission;
    })();
    const verify = useAuth((state) => {
        return state.setVerify;
    });
    const verified = useAuth((state) => {
        return state.verified;
    });

    const [error, setError] = useState({
        message: "Error",
        showCondition: false,
    });

    return (
        <Layout>
            <div className="relative mb-4 flex h-full min-h-[80vh] w-full flex-col items-center justify-center overflow-hidden">
                <form className="prose form-control space-y-4 rounded-xl border p-14">
                    <h2>
                        What{" "}
                        <span className="text-secondary">type of account</span>{" "}
                        would you like to sign up for?
                    </h2>

                    <p className="text-sm font-bold text-secondary md:text-lg lg:text-xl">
                        I&apos;m a...
                    </p>

                    <div className="flex items-center space-x-3">
                        <Link className="underline" href="/resident/signUp">
                            <a className="underline">
                                <span className=" text-sm font-bold md:text-base">
                                    STAFF
                                </span>
                            </a>
                        </Link>
                    </div>

                    <div className="flex items-center space-x-3">
                        <Link className="underline" href="/receptionist/signUp">
                            <a className="underline">
                                <span className=" text-sm font-bold md:text-base">
                                    ADMIN
                                </span>
                            </a>
                        </Link>
                    </div>
                </form>
            </div>
        </Layout>
    );
};

export default SignUp;
