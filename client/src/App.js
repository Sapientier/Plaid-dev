import React, { useCallback, useState, useEffect } from "react";
import { usePlaidLink } from "react-plaid-link";
import './App.css';
import logo from './logo.svg';

const PlaidLink = ({ token }) => {
    const onSuccess = useCallback(
        (public_token) => {
            // send public_token to server
            const response = fetch('/set_access_token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ public_token }),
            });
            // Handle response ...
            console.log(response);
        },
        []
    );

    const config = {
        token,
        onSuccess,
        // onExit
        // onEvent
    };

    const { open, ready } = usePlaidLink(config);

    return (
        <button className="button" onClick={() => open()} disabled={!ready}>
            Connect a bank account
        </button>
    );
};

const App = () => {
    const [token, setToken] = useState(null);

    // generate a link_token
    useEffect(() => {
        const createLinkToken = async () => {
            let response = await fetch("/create_link_token", {
                method: "POST",
            });
            const { link_token } = await response.json();
            setToken(link_token);
            console.log(link_token);
        }
        createLinkToken();
    }, []);

    // only initialize Link once our token exists
    return (
        <div className="centerDiv">
            {token === null ? (
                // insert your loading animation here
                <div className="loader"></div>
            ) : (
                <>
                    <img src={logo} className="App-logo" alt="logo" />
                    <PlaidLink token={token} />
                </>
            )}
        </div>
    )
};

export default App;