import { SpotifyCredentials, AuthorizationCodeTokenResponse } from "./spotify_authentication";
import {importJson} from "./file";
import {openSync, readFileSync, writeFileSync} from 'fs';
import axios from "axios";
import express from "express";
import { randomBytes } from "crypto";
import { Buffer } from "buffer";

function generateRandomString(length: number) {
    const generatedBytes = randomBytes(Math.ceil(length / 2));
    return generatedBytes.toString('hex').slice(0, length);
}

/*
const tokenRequester = new SpotifyTokenRequester();
tokenRequester.getToken().then((response) => {
    console.log(response.data);
});
*/
/*
const spotifyCredentials = importJson<SpotifyCredentials>("./private_config/spotify_client_config.json");
const spotify = SpotifyApi.withClientCredentials(spotifyCredentials.clientId, spotifyCredentials.clientSecret, []);

spotify.search("Taylor Swift ...Ready for it?", ["track"], "US", 10, 0).then((data) => {
    console.log("Ran spotify search: ");
    console.log(data.tracks.items);
})

spotify.
*/
//TODO: make express server to serve files locally :(((

const serverApp = express();
const port = 3000;
const redirect_uri = "http://localhost:3000/callback";
const spotifyCredentials = importJson<SpotifyCredentials>("./private_config/spotify_client_config.json");

serverApp.use(express.static(`public`));

serverApp.get("/callback", function(request, response) {

    const code = request.query.code || null;
    const state = request.query.state || null;

    if(state !== null) {
        console.log("Getting user token:");
        const spotifyTokenUrl = `https://accounts.spotify.com/api/token`;
        const formData = new FormData();
        formData.set(`code`, code);
        formData.set(`redirect_uri`, redirect_uri);
        formData.set(`grant_type`, 'authorization_code');
        const encodedCredentials = Buffer.from(spotifyCredentials.clientId + ':' + spotifyCredentials.clientSecret);
        const headers = {
            'content-type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + encodedCredentials.toString('base64')
        }
        axios.post<AuthorizationCodeTokenResponse>(spotifyTokenUrl, {code, redirect_uri, grant_type: 'authorization_code'} , { headers }).then((response) => {
            console.log(`Token: ${response.data.access_token}`);
            console.log(response.data);
            const jsonData = JSON.stringify(response.data);

            const saveFileName = 'data/user_token.json';
            writeFileSync(saveFileName, jsonData);
            console.log(`out put to ${saveFileName}`);

        }).catch((error) => {
            console.log(error);
            console.log("error getting token with callback response");
        });
    }

    response.set('Content-Type', 'text/html');
    response.send(readFileSync(`public/callback.html`, { encoding: 'utf8', flag: 'r' }));
});

serverApp.get("/login", function(request, response) {
    const state = generateRandomString(16);
    const scope = 'playlist-modify-public playlist-modify-private user-library-modify user-library-read';
    const urlParams = new URLSearchParams({
        response_type: 'code',
        client_id: spotifyCredentials.clientId,
        scope,
        redirect_uri,
        state
    });
    response.redirect(`https://accounts.spotify.com/authorize?${urlParams}`);
});

serverApp.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
})
