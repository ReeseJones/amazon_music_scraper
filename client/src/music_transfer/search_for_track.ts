import {SongListItem} from "./song_list_item";
import {container, identifiers} from '../app/service_container';
import {delay} from "../time";
import { Track } from "@spotify/web-api-ts-sdk";

const spotify = container.get(identifiers.spotify);

function tokenizer(str: string): Set<string> {
    str = str.toLowerCase();
    str = str.replaceAll(/((feat\.)|(explicit)|\[|\]|\(|\)|\,|\\|\/|\"|\')+/g,'');
    return new Set(str.split(" "));
}

export function compareTrackWithTokens(track: Track, tokens: {
    titleTerms: Set<string>;
    descriptionTerms: Set<string>;
    artistTerms: Set<string>;
    combinedTerms: Set<string>;
}): number {

    const spotifyTokens: typeof tokens = {
        titleTerms: tokenizer(track.name),
        descriptionTerms: tokenizer(track.album.name),
        artistTerms: tokenizer(track.artists.map((artist) => artist.name).join(" ")),
        combinedTerms: new Set<string>(),
    };
    spotifyTokens.combinedTerms = new Set([...spotifyTokens.artistTerms, ...spotifyTokens.descriptionTerms, ...spotifyTokens.titleTerms]);
    const matchingTitleTokens = tokens.titleTerms.intersection(spotifyTokens.titleTerms);
    const matchingDescriptionTokens = tokens.descriptionTerms.intersection(spotifyTokens.descriptionTerms);
    const matchingArtistTokens = tokens.artistTerms.intersection(spotifyTokens.artistTerms);
    const matchingAllTokens = tokens.combinedTerms.intersection(spotifyTokens.combinedTerms);
    let total = 0;
    let consideredTerms = 0;

    if(tokens.titleTerms.size > 0) {
        total += (matchingTitleTokens.size / tokens.titleTerms.size) * 2;
        consideredTerms += 2;
    }

    if(tokens.descriptionTerms.size > 0) {
        total += matchingDescriptionTokens.size / tokens.descriptionTerms.size;
        consideredTerms += 1;
    }

    if(tokens.artistTerms.size > 0) {
        total += matchingArtistTokens.size / tokens.artistTerms.size;
        consideredTerms += 1;
    }

    if(tokens.combinedTerms.size > 0) {
        total += matchingAllTokens.size / tokens.combinedTerms.size;
        consideredTerms += 1;
    }

    const finalPercentage = total / consideredTerms;

    console.log(`compared: ${finalPercentage} with tokens: ${tokens.combinedTerms.values().toArray().join(' ')} and ${spotifyTokens.combinedTerms.values().toArray().join(' ')}`);

    return finalPercentage;
}

export async function searchForTrack(songListItem: SongListItem): Promise<void> {
    console.log(`Searching spotify for '${songListItem.title}' by '${songListItem.artist}'`);
    songListItem.foundMatch = "Searching...";

    const artistTerm = songListItem.artist !== 'VARIOUS ARTISTS' ? songListItem.artist: '';
    
    const titleTerms = tokenizer(songListItem.title);
    const descriptionTerms = tokenizer(songListItem.description);
    const artistTerms = tokenizer(artistTerm);
    const combinedTerms = new Set<string>();
    titleTerms.forEach(combinedTerms.add, combinedTerms);
    descriptionTerms.forEach(combinedTerms.add, combinedTerms);
    artistTerms.forEach(combinedTerms.add, combinedTerms);

    const tokens = {
        titleTerms,
        descriptionTerms,
        artistTerms,
        combinedTerms
    }

    let searchTerm = `${songListItem.title} ${[...combinedTerms].join(" ")}`;
    console.log(`Searching query: ${searchTerm}`);
    const searchResult = await spotify.search(searchTerm, ["track"], "US", 3, 0);
    songListItem.foundMatch = "Analyzing...";

    let bestTrack: Track | undefined;
    let currentMatchPercentage = 0;
    for ( const track of searchResult.tracks.items ) {
        const matchPercentage = compareTrackWithTokens(track, tokens);

        if(matchPercentage > currentMatchPercentage) {
            currentMatchPercentage = matchPercentage;
            bestTrack = track;
        }
    }

    if(bestTrack) {
        songListItem.spotifySongTitle = bestTrack.name;
        songListItem.spotifyAlbum = bestTrack.album.name;
        songListItem.spotifyArtists = bestTrack.artists.map(a => a.name).join(" ");
        const [hasTrack] = await spotify.currentUser.tracks.hasSavedTracks([bestTrack.id]);
        songListItem.savedToSpotify = hasTrack ? "yes" : "no";
        songListItem.matchPercentage = (currentMatchPercentage * 100).toPrecision(4);
        songListItem.spotifySongId = bestTrack.id;

        if(currentMatchPercentage > 0.60) {
            songListItem.foundMatch = "yes";
            songListItem.shouldUpload = "yes";
        } else if (currentMatchPercentage > 0.40) {
            songListItem.foundMatch = "maybe";
            songListItem.shouldUpload = "yes";
        } else {
            songListItem.foundMatch = "no";
            songListItem.shouldUpload = "no";
        }

        if(hasTrack) {
            songListItem.shouldUpload = "no";
        }

    } else {
        songListItem.foundMatch = "no";
    }

    await delay(1000);
}
