import assert from 'node:assert';
import { createReadStream, appendFileSync, closeSync, openSync } from 'node:fs';
import { parse } from 'csv-parse';

import { importJson } from "./file";
import { SpotifyApi, AccessToken } from '@spotify/web-api-ts-sdk';
import { SpotifyCredentials } from "./spotify_authentication";
import { delay } from "./time";
import { error } from "node:console";


const spotify_config = importJson<SpotifyCredentials>("private_config/spotify_client_config.json");
const data = importJson<AccessToken>("data/user_token.json");

const spotify = SpotifyApi.withAccessToken(spotify_config.clientId, data);

const changeManifestFilename = "save_data/changes.tsv";

// Read and process the CSV file
const processFile = async (filePath: string) => {
  const parser = createReadStream(filePath).pipe(parse({ 
    delimiter: "\t",
    relaxQuotes: true,
    ltrim: true,
    rtrim: true
}));

    let fd;
    try {
        fd = openSync(changeManifestFilename, 'a');
        for await (const record of parser) {
            const line = await handleAmazonSongRecord(record);
            appendFileSync(fd, line, 'utf8');
        }
    } catch (err) {
        /* Handle the error */
        console.log(`error processing opening and handling amazon recordings ${err}`);
        throw err;
    } finally {
        if (fd !== undefined) {
            closeSync(fd);
        }
    } 

};

async function handleAmazonSongRecord(record: string[]): Promise<string> {
    //console.log(`processing: ${record.join(" ")}`);
    const [songIndex, title, artist, description, runtime] = record;
    console.log(`Searching spotify for '${title}' by '${artist}'`);
    await delay(1500);

    let searchTerm = `${title}${artist != 'VARIOUS ARTISTS' ? artist: ''}`;
    const searchResult = await spotify.search(searchTerm, ["track"], "US", 5, 0);

    let spotifySongId = ``;
    let spotifyMatch = "no";
    let newTrackTitle = '';
    let albumTitle ='';
    let spotifyArtists = "";
    console.log(`Found ${searchResult.tracks.items.length} results.`);

    for( const track of searchResult.tracks.items ) {
        const titleMatch = track.name.includes(title);
        const artistMatch = track.artists.some((songArtistName) => songArtistName.name.includes(artist) );

        if(!titleMatch) {
            continue;
        }

        if(titleMatch) {
            spotifySongId = track.id;
            spotifyMatch = artistMatch ? "yes" : "maybe";
            newTrackTitle = track.name;
            albumTitle = track.album.name;
            spotifyArtists = track.artists.map((a) => a.name).join();
            console.log(`Potential Track Match: ${newTrackTitle} ${spotifyArtists} ${albumTitle}`);
            break;
        }
    }

    if(spotifyMatch === "no") {
        console.log(`Couldn't find a match for '${title}' by '${artist}'.`);
    }

    let csvRecord = `${title}\t${artist}\t${spotifyMatch}\t${spotifySongId}\t${newTrackTitle}\t${albumTitle}\t${spotifyArtists}\n`;

    return csvRecord;
}

processFile(`save_data/nicholes_song_list.tsv`).then(() => {
    console.log("all files processed");
});