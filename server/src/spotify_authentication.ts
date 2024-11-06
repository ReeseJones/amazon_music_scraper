import axios, {isCancel, AxiosError} from 'axios';
import { URLSearchParams } from 'node:url';
import { importJson } from "./file";

export interface SpotifyCredentials {
    clientId: string,
    clientSecret: string
}

export interface SpotifyTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
}

export interface AuthorizationCodeTokenResponse extends SpotifyTokenResponse {
    scope: string;
    refresh_token: string;
}

export class SpotifyTokenRequester {
    private readonly url = `https://accounts.spotify.com/api/token`;
    
    private readonly tokenRequestHeaders = {
        'User-Agent': "PostmanRuntime/7.42.0",
        'Content-Type': "application/x-www-form-urlencoded",
        'Accept': "*/*",
    }

    private readonly configPath = "./private_config/spotify_client_config.json";
    
    private readonly requestParams: URLSearchParams;
    constructor() {
        const spotifyCredentials = importJson<SpotifyCredentials>(this.configPath);
        this.requestParams = new URLSearchParams();
        this.requestParams.append("grant_type", "client_credentials");
        this.requestParams.append("client_id", spotifyCredentials.clientId);
        this.requestParams.append("client_secret", spotifyCredentials.clientSecret);
    }

    public async getToken() {
        return axios.post<SpotifyTokenResponse>(this.url, this.requestParams, {headers: this.tokenRequestHeaders})
    }
}