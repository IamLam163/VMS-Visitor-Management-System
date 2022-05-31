import { useState } from "react";
import { useRouter } from "next/router";
import { Formik, Field } from "formik";
import { gql, useMutation } from "@apollo/client";
import { motion } from "framer-motion";

import useAuth from "../store/authStore.js";

import Layout from "../components/Layout";
import ErrorAlert from "../components/ErrorAlert";

const CreateInvite = () => {
    const [showErrorAlert, setShowErrorAlert] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const jwtTokenData = useAuth((state) => state.decodedToken)();
    const numParkingSpotsAvailable = useAuth((state) => state.numParkingSpots);
    const router = useRouter();

    const driveAway = {
        initial: {
            scale: 1.2,
            x: 0,
        },
        animate: {
            x: 900,
        },
    };

    const [createInviteMutation, { error }] = useMutation(gql`
        mutation {
            createInvite(
                userEmail: "${undefined}"
                visitorEmail: "${undefined}"
                IDDocType: "${undefined}"
                IDNumber: "${undefined}"
                inviteDate: "${undefined}"
                requiresParking: ${undefined}
            )
        }
    `);

    return (
        <Layout>
            <div className="relative flex h-full min-h-[80vh] w-full flex-col items-center justify-center overflow-hidden">
                <Formik
                    initialValues={{
                        email: "",
                        idDoc: "RSA-ID",
                        idValue: "",
                        visitDate: "",
                        reserveParking: false,
                    }}
                    validate={(values) => {
                        const errors = {};
                        if (!values.email) {
                            errors.email = "Required";
                        } else if (
                            !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(
                                values.email
                            )
                        ) {
                            errors.email = "Invalid email address";
                        } else if (!values.idValue) {
                            errors.idValue = "Required";
                        } else if (
                            (values.idDoc === "RSA-ID" ||
                                values.idDoc === "drivers-license") &&
                            !/^(((\d{2}((0[13578]|1[02])(0[1-9]|[12]\d|3[01])|(0[13456789]|1[012])(0[1-9]|[12]\d|30)|02(0[1-9]|1\d|2[0-8])))|([02468][048]|[13579][26])0229))(( |-)(\d{4})( |-)(\d{3})|(\d{7}))$/i.test(
                                values.idValue
                            )
                        ) {
                            errors.idValue = "Invalid RSA ID";
                        } else if (
                            values.idDoc === "UP-Student-ID" &&
                            !/^\d{8}$/i.test(values.idValue)
                        ) {
                            errors.idValue = "Invalid UP student number";
                        } else if (!values.visitDate) {
                            errors.visitDate = "Please add a date";
                        }

                        return errors;
                    }}
                    onSubmit={(values, { setSubmitting }) => {
                        const CREATE_INVITE = gql`
                            mutation {
                                createInvite(
                                    userEmail: "${jwtTokenData.email}"
                                    visitorEmail: "${values.email}"
                                    IDDocType: "${values.idDoc}"
                                    IDNumber: "${values.idValue}"
                                    inviteDate: "${values.visitDate}"
                                    requiresParking: ${values.reserveParking}
                            )
                        }
                        `;

                        createInviteMutation({
                            mutation: CREATE_INVITE,
                        })
                            .then(() => {
                                router.push("/visitorDashboard");
                                setShowErrorAlert(false);
                                setSubmitting(false);
                            })
                            .catch((err) => {
                                console.log(err);
                                setSubmitting(false);
                                if (err.message === "Unauthorized") {
                                    router.push("/expire");
                                    return;
                                } else {
                                    setErrorMessage(err.message);
                                    setShowErrorAlert(true);
                                }
                            });
                    }}
                >
                    {({
                        values,
                        errors,
                        touched,
                        handleChange,
                        handleBlur,
                        handleSubmit,
                        isSubmitting,
                    }) => (
                        <form
                            onSubmit={handleSubmit}
                            className="md:p-26 prose form-control space-y-4 rounded-none bg-base-300 p-14 md:rounded-xl"
                        >
                            <h1>
                                Let&apos;s{" "}
                                <span className="text-secondary">Invite</span>{" "}
                                Someone🔥
                            </h1>
                            <input
                                type="email"
                                name="email"
                                placeholder="Visitor Email"
                                autoComplete="username"
                                className="input input-bordered w-full"
                                onChange={handleChange}
                                onBlur={handleBlur}
                                value={values.email}
                            />

                            <span className="text-error">
                                {errors.email && touched.email && errors.email}
                            </span>

                            <Field
                                as="select"
                                className="select select-primary w-full"
                                name="idDoc"
                                onChange={handleChange}
                                onBlur={handleBlur}
                            >
                                <option value="RSA-ID">RSA ID</option>
                                <option value="Drivers-License">
                                    Driver&apos;s License
                                </option>
                                <option value="UP-Student-ID">
                                    Student Number
                                </option>
                            </Field>

                            <input
                                type="text"
                                name="idValue"
                                placeholder="Enter ID number"
                                className="input input-bordered w-full"
                                onChange={handleChange}
                                onBlur={handleBlur}
                                value={values.idValue}
                            />
                            <span className="text-error">
                                {errors.idValue &&
                                    touched.email &&
                                    errors.idValue}
                            </span>

                            <input
                                type="date"
                                name="visitDate"
                                placeholder="Visit Date"
                                className="input input-bordered w-full"
                                onChange={handleChange}
                                onBlur={handleBlur}
                                value={values.visitDate}
                            />

                            <motion.label className="label cursor-pointer">
                                <motion.span
                                    initial="initial"
                                    whileHover="animate"
                                    className="label-text overflow-x-hidden pr-3"
                                >
                                    Reserve Parking{" "}
                                    <motion.span
                                        initial="initial"
                                        className="inline-block"
                                        animate={{
                                            x: values.reserveParking ? 0 : -500,
                                            transition: {
                                                duration: 0.8,
                                                ease: "easeInOut",
                                            },
                                        }}
                                        variants={driveAway}
                                    >
                                        {" "}
                                        🚗
                                    </motion.span>
                                </motion.span>

                                <motion.input
                                    className="disabled toggle"
                                    disabled={
                                        numParkingSpotsAvailable > 0
                                            ? false
                                            : true
                                    }
                                    name="reserveParking"
                                    type="checkbox"
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    value={values.reserveParking}
                                />
                            </motion.label>

                            <button
                                className="btn btn-primary"
                                type="submit"
                                disabled={isSubmitting}
                            >
                                Invite
                            </button>
                        </form>
                    )}
                </Formik>

                <ErrorAlert
                    message={errorMessage}
                    showConditon={showErrorAlert}
                />
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

export default CreateInvite;
