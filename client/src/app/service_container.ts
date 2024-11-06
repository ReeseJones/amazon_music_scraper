import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { Container, injected, token } from 'brandi';

export const container = new Container();

export const identifiers = {
    spotifyClientId: token<string>("spotifyClientId"),
    redirectUrl: token<string>("redirectUrl"),
    spotify: token<SpotifyApi>('Spotify client'),
    spotifyScopes: token<string[]>('spotify scopes')
}

function spotifyFactory(clientId: string, redirectUrl: string, scopes: string[]) {
    return SpotifyApi.withUserAuthorization(clientId, redirectUrl, scopes);
}
injected(spotifyFactory, identifiers.spotifyClientId, identifiers.redirectUrl, identifiers.spotifyScopes);

container.bind(identifiers.spotifyClientId).toConstant("854cc30bdfb64775a728c5e0125946a1");
container.bind(identifiers.redirectUrl).toConstant("http://localhost:3000");
container.bind(identifiers.spotifyScopes).toConstant(['playlist-modify-public', 'playlist-modify-private', 'user-library-modify', 'user-library-read']);
container.bind(identifiers.spotify).toInstance(spotifyFactory).inSingletonScope();
